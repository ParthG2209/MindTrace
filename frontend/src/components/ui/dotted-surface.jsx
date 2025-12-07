import React, { useEffect, useRef, useState } from 'react';

// Inline cn utility
const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

export function DottedSurface({ className, darkMode = true, ...props }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    let mounted = true;
    let animationId = null;
    let scene, camera, renderer, geometry, material, points;

    const initThree = async () => {
      try {
        // Dynamic import of Three.js
        const THREE = await import('three');
        
        if (!mounted || !containerRef.current) return;

        const SEPARATION = 150;
        const AMOUNTX = 40;
        const AMOUNTY = 60;

        // Scene setup
        scene = new THREE.Scene();
        scene.fog = new THREE.Fog(0x000000, 2000, 10000);

        // Camera setup
        camera = new THREE.PerspectiveCamera(
          60,
          window.innerWidth / window.innerHeight,
          1,
          10000
        );
        camera.position.set(0, 355, 1220);

        // Renderer setup
        renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: true,
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000000, 0);

        // Append to container
        if (containerRef.current) {
          containerRef.current.appendChild(renderer.domElement);
        }

        // Create particle geometry
        const positions = [];
        const colors = [];
        geometry = new THREE.BufferGeometry();

        for (let ix = 0; ix < AMOUNTX; ix++) {
          for (let iy = 0; iy < AMOUNTY; iy++) {
            const x = ix * SEPARATION - (AMOUNTX * SEPARATION) / 2;
            const y = 0;
            const z = iy * SEPARATION - (AMOUNTY * SEPARATION) / 2;

            positions.push(x, y, z);

            // White particles for dark mode, dark for light mode
            if (darkMode) {
              colors.push(255, 255, 255); // Brighter white
            } else {
              colors.push(50, 50, 50);
            }
          }
        }

        geometry.setAttribute(
          'position',
          new THREE.Float32BufferAttribute(positions, 3)
        );
        geometry.setAttribute(
          'color',
          new THREE.Float32BufferAttribute(colors, 3)
        );

        // Create material with higher visibility
        material = new THREE.PointsMaterial({
          size: 10, // Increased size for better visibility
          vertexColors: true,
          transparent: true,
          opacity: 0.6, // Reduced opacity for subtlety
          sizeAttenuation: true,
        });

        // Create points
        points = new THREE.Points(geometry, material);
        scene.add(points);

        let count = 0;

        // Animation loop
        const animate = () => {
          if (!mounted) return;
          
          animationId = requestAnimationFrame(animate);

          const positionAttribute = geometry.attributes.position;
          const posArray = positionAttribute.array;

          let i = 0;
          for (let ix = 0; ix < AMOUNTX; ix++) {
            for (let iy = 0; iy < AMOUNTY; iy++) {
              const index = i * 3;
              posArray[index + 1] =
                Math.sin((ix + count) * 0.3) * 50 +
                Math.sin((iy + count) * 0.5) * 50;
              i++;
            }
          }

          positionAttribute.needsUpdate = true;
          renderer.render(scene, camera);
          count += 0.05;
        };

        // Handle resize
        const handleResize = () => {
          if (!camera || !renderer) return;
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener('resize', handleResize);

        // Start animation
        animate();

        // Store cleanup references
        sceneRef.current = {
          scene,
          camera,
          renderer,
          geometry,
          material,
          points,
          animationId,
          handleResize,
        };

      } catch (err) {
        console.error('Three.js initialization error:', err);
        setError(err.message);
      }
    };

    initThree();

    // Cleanup
    return () => {
      mounted = false;

      if (animationId) {
        cancelAnimationFrame(animationId);
      }

      if (sceneRef.current) {
        const { handleResize, renderer, geometry, material, scene } = sceneRef.current;

        if (handleResize) {
          window.removeEventListener('resize', handleResize);
        }

        if (geometry) {
          geometry.dispose();
        }

        if (material) {
          material.dispose();
        }

        if (renderer) {
          renderer.dispose();
          if (containerRef.current && renderer.domElement) {
            try {
              containerRef.current.removeChild(renderer.domElement);
            } catch (e) {
              console.error('Cleanup error:', e);
            }
          }
        }

        if (scene) {
          scene.clear();
        }
      }

      sceneRef.current = null;
    };
  }, [darkMode]);

  if (error) {
    console.error('DottedSurface error:', error);
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={cn('pointer-events-none fixed inset-0 z-0', className)}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
      {...props}
    />
  );
}