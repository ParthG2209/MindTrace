import React, { useEffect, useRef, useState } from 'react';

// Inline cn utility to avoid path issues
const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

// Lazy load Three.js to avoid SSR issues
let THREE = null;

export function DottedSurface({ className, darkMode = true, ...props }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const [isClient, setIsClient] = useState(false);
  const [threeLoaded, setThreeLoaded] = useState(false);

  // Ensure we're on client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load Three.js dynamically
  useEffect(() => {
    if (!isClient) return;

    const loadThree = async () => {
      try {
        THREE = await import('three');
        setThreeLoaded(true);
      } catch (error) {
        console.error('Failed to load Three.js:', error);
      }
    };

    loadThree();
  }, [isClient]);

  useEffect(() => {
    if (!containerRef.current || !threeLoaded || !THREE) return;

    const SEPARATION = 150;
    const AMOUNTX = 40;
    const AMOUNTY = 60;

    let scene, camera, renderer, geometry, material, points;
    let animationId;
    let count = 0;

    try {
      // Scene setup
      scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0xffffff, 2000, 10000);

      camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        1,
        10000
      );
      camera.position.set(0, 355, 1220);

      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setClearColor(scene.fog.color, 0);
      
      containerRef.current.appendChild(renderer.domElement);

      // Create particles
      const positions = [];
      const colors = [];

      // Create geometry for all particles
      geometry = new THREE.BufferGeometry();

      for (let ix = 0; ix < AMOUNTX; ix++) {
        for (let iy = 0; iy < AMOUNTY; iy++) {
          const x = ix * SEPARATION - (AMOUNTX * SEPARATION) / 2;
          const y = 0;
          const z = iy * SEPARATION - (AMOUNTY * SEPARATION) / 2;

          positions.push(x, y, z);

          if (darkMode) {
            colors.push(200, 200, 200);
          } else {
            colors.push(0, 0, 0);
          }
        }
      }

      geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(positions, 3)
      );
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

      // Create material
      material = new THREE.PointsMaterial({
        size: 8,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true,
      });

      // Create points object
      points = new THREE.Points(geometry, material);
      scene.add(points);

      // Animation function
      const animate = () => {
        animationId = requestAnimationFrame(animate);

        const positionAttribute = geometry.attributes.position;
        const positions = positionAttribute.array;

        let i = 0;
        for (let ix = 0; ix < AMOUNTX; ix++) {
          for (let iy = 0; iy < AMOUNTY; iy++) {
            const index = i * 3;
            positions[index + 1] =
              Math.sin((ix + count) * 0.3) * 50 +
              Math.sin((iy + count) * 0.5) * 50;
            i++;
          }
        }

        positionAttribute.needsUpdate = true;
        renderer.render(scene, camera);
        count += 0.1;
      };

      // Handle window resize
      const handleResize = () => {
        if (!camera || !renderer) return;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };

      window.addEventListener('resize', handleResize);

      // Start animation
      animate();

      // Store references
      sceneRef.current = {
        scene,
        camera,
        renderer,
        geometry,
        material,
        points,
        animationId,
      };

      // Cleanup function
      return () => {
        try {
          window.removeEventListener('resize', handleResize);
          
          if (animationId) {
            cancelAnimationFrame(animationId);
          }

          if (geometry) {
            geometry.dispose();
          }

          if (material) {
            material.dispose();
          }

          if (renderer) {
            renderer.dispose();
            if (containerRef.current && renderer.domElement && containerRef.current.contains(renderer.domElement)) {
              containerRef.current.removeChild(renderer.domElement);
            }
          }

          if (scene) {
            scene.clear();
          }

          sceneRef.current = null;
        } catch (error) {
          console.error('Cleanup error:', error);
        }
      };
    } catch (error) {
      console.error('Three.js initialization error:', error);
      return () => {};
    }
  }, [darkMode, threeLoaded, isClient]);

  // Don't render anything until we're on the client
  if (!isClient) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={cn('pointer-events-none fixed inset-0 -z-10', className)}
      {...props}
    />
  );
}