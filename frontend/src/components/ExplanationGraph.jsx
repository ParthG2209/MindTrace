// parthg2209/mindtrace/MindTrace-454002ad537de541ce806a44cdbebf379fec4615/frontend/src/components/ExplanationGraph.jsx

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { 
  GitBranch, AlertTriangle, XCircle, ZoomIn, ZoomOut, RefreshCw,
  CheckCircle, Minimize2, Maximize2, ArrowRight
} from 'lucide-react';
import apiClient from '../api/client';

// Utility for deep comparison
const useDeepCompareMemo = (factory, deps) => {
  const ref = useRef(undefined);
  const isEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  if (!ref.current || !isEqual(ref.current.deps, deps)) {
    ref.current = { deps, value: factory() };
  }
  return ref.current.value;
};

const ExplanationGraph = ({ segments, sessionId, coherenceData: initialCoherenceData }) => {
  const svgRef = useRef();
  const containerRef = useRef();
  const simulationRef = useRef();
  const nodesRef = useRef([]);
  
  const [coherenceData, setCoherenceData] = useState(initialCoherenceData);
  const [loading, setLoading] = useState(!initialCoherenceData && !!sessionId);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fetch coherence data if missing
  useEffect(() => {
    const fetchCoherence = async () => {
      if (!sessionId || initialCoherenceData) return;
      try {
        setLoading(true);
        // CHANGED: Use apiClient instead of fetch
        const response = await apiClient.get(`/api/coherence/${sessionId}`);
        setCoherenceData(response.data);
      } catch (error) {
        setCoherenceData({ contradictions: [], topic_drifts: [], logical_gaps: [] });
      } finally {
        setLoading(false);
      }
    };
    fetchCoherence();
  }, [sessionId, initialCoherenceData]);

  useEffect(() => {
    if (initialCoherenceData) setCoherenceData(initialCoherenceData);
  }, [initialCoherenceData]);

  // Advanced graph data processing
  const graphData = useDeepCompareMemo(() => {
    if (!segments || segments.length === 0) return { nodes: [], links: [] };

    const drifts = coherenceData?.topic_drifts || [];
    const contradictions = coherenceData?.contradictions || [];
    const gaps = coherenceData?.logical_gaps || [];

    // Helper: Calculate semantic similarity (mock)
    const calculateSimilarity = (seg1, seg2) => {
      const words1 = seg1.text.toLowerCase().split(/\s+/);
      const words2 = seg2.text.toLowerCase().split(/\s+/);
      const intersection = words1.filter(w => words2.includes(w)).length;
      const union = new Set([...words1, ...words2]).size;
      return intersection / union;
    };

    // Helper: Determine segment role
    const determineRole = (seg, index, allSegs) => {
      if (index === 0) return 'introduce';
      if (index === allSegs.length - 1) return 'conclude';
      if (seg.overall_segment_score < 5) return 'anomaly';
      
      const prevSim = index > 0 ? calculateSimilarity(seg, allSegs[index - 1]) : 0;
      const nextSim = index < allSegs.length - 1 ? calculateSimilarity(seg, allSegs[index + 1]) : 0;
      
      if (prevSim < 0.3 && nextSim > 0.5) return 'transition';
      if (prevSim > 0.7 && nextSim > 0.7) return 'elaborate';
      return 'transition';
    };

    // Helper: Get primary issue
    const getPrimaryIssue = (seg) => {
      const scores = {
        clarity: seg.clarity?.score || 10,
        structure: seg.structure?.score || 10,
        correctness: seg.correctness?.score || 10,
        pacing: seg.pacing?.score || 10,
        communication: seg.communication?.score || 10,
      };
      const sorted = Object.entries(scores).sort((a, b) => a[1] - b[1]);
      const lowest = sorted[0];
      return lowest[1] >= 7.5 ? 'good' : lowest[0];
    };

    // Helper: Get color for issue type
    const getIssueColor = (issue) => {
      const colors = {
        good: '#10b981',
        clarity: '#3b82f6',
        structure: '#8b5cf6',
        correctness: '#ef4444',
        pacing: '#f59e0b',
        communication: '#ec4899'
      };
      return colors[issue] || '#6b7280';
    };

    // Create nodes with enhanced metadata
    const nodes = segments.map((seg, i) => {
      const role = determineRole(seg, i, segments);
      const primaryIssue = getPrimaryIssue(seg);
      const driftItem = drifts.find(d => d.segment_id === seg.segment_id);
      
      // Calculate node size based on score
      const radius = 15 + (seg.overall_segment_score * 2.5);
      
      const node = {
        id: seg.segment_id,
        label: `S${seg.segment_id + 1}`,
        fullText: seg.text,
        score: seg.overall_segment_score,
        radius: radius,
        role: role,
        primaryIssue: primaryIssue,
        color: getIssueColor(primaryIssue),
        isDrift: !!driftItem,
        driftDegree: driftItem ? driftItem.drift_degree : 0,
        isRoot: i === 0,
        isDeadEnd: i === segments.length - 1 && seg.overall_segment_score < 4,
      };

      // CRITICAL FIX: Strictly preserve physics state
      const prev = nodesRef.current.find(n => n.id === node.id);
      if (prev) {
        node.x = prev.x;
        node.y = prev.y;
        node.vx = prev.vx;
        node.vy = prev.vy;
        // Keep fixed state if it was dragged
        node.fx = prev.fx;
        node.fy = prev.fy;
      }
      return node;
    });

    nodesRef.current = nodes;

    // Create links
    const links = [];
    
    // Sequential links
    for (let i = 0; i < nodes.length - 1; i++) {
      const source = nodes[i];
      const target = nodes[i + 1];
      const similarity = calculateSimilarity(segments[i], segments[i + 1]);
      
      const gap = gaps.find(g => 
        (g.between_segment1 === source.id && g.between_segment2 === target.id) ||
        (g.between_segment1 === target.id && g.between_segment2 === source.id)
      );
      
      let linkType = 'backbone';
      if (gap) linkType = 'gap';
      else if (similarity < 0.3) linkType = 'weak';
      else if (similarity < 0.5) linkType = 'drift';
      else if (source.score < 6 || target.score < 6) linkType = 'error';
      
      links.push({
        source: source.id,
        target: target.id,
        type: linkType,
        similarity: similarity,
        id: `link-${source.id}-${target.id}`
      });
    }

    // Contradiction links
    contradictions.forEach((c, idx) => {
      const source = nodes.find(n => n.id === c.segment1_id);
      const target = nodes.find(n => n.id === c.segment2_id);
      if (source && target) {
        links.push({
          source: source.id,
          target: target.id,
          type: 'contradiction',
          severity: c.severity,
          id: `contra-${idx}`
        });
      }
    });

    return { nodes, links };
  }, [segments, coherenceData]);

  // D3 Rendering
  useEffect(() => {
    if (!graphData.nodes.length || !svgRef.current) return;

    const width = containerRef.current?.clientWidth || 900;
    const height = isFullscreen ? window.innerHeight - 100 : 600;
    const svg = d3.select(svgRef.current);
    
    svg.attr('width', width).attr('height', height);

    // Setup layers
    let mainGroup = svg.select('g.main-group');
    if (mainGroup.empty()) {
      mainGroup = svg.append('g').attr('class', 'main-group');
      // Simple layering: Links bottom, Nodes top
      mainGroup.append('g').attr('class', 'links');
      mainGroup.append('g').attr('class', 'nodes');

      // Zoom behavior
      const zoom = d3.zoom()
        .scaleExtent([0.1, 4])
        .on('zoom', (event) => mainGroup.attr('transform', event.transform));
      
      svg.call(zoom)
         .call(zoom.transform, d3.zoomIdentity.translate(width/2 - (graphData.nodes.length * 60), height/2).scale(0.8));

      // Arrow markers
      const defs = svg.append('defs');
      
      // Normal arrow
      defs.append('marker').attr('id', 'arrow-normal')
        .attr('viewBox','0 -5 10 10').attr('refX',32).attr('refY',0)
        .attr('markerWidth',6).attr('markerHeight',6).attr('orient','auto')
        .append('path').attr('d','M0,-5L10,0L0,5').attr('fill','#94a3b8');
      
      // Contradiction arrow
      defs.append('marker').attr('id', 'arrow-contradiction')
        .attr('viewBox','0 -5 10 10').attr('refX',28).attr('refY',0)
        .attr('markerWidth',8).attr('markerHeight',8).attr('orient','auto')
        .append('path').attr('d','M0,-5L10,0L0,5').attr('fill','#ef4444');
      
      // Weak arrow
      defs.append('marker').attr('id', 'arrow-weak')
        .attr('viewBox','0 -5 10 10').attr('refX',28).attr('refY',0)
        .attr('markerWidth',5).attr('markerHeight',5).attr('orient','auto')
        .append('path').attr('d','M0,-5L10,0L0,5').attr('fill','#6b7280');
    }

    // --- FIX 1: CONDITIONAL TREE LAYOUT ---
    // Only apply the rigid tree layout to nodes that DO NOT have a position yet.
    // This stops the "twitch/collapse" where nodes snap back to grid on every update.
    const layoutTree = () => {
      const nodes = graphData.nodes;
      const links = graphData.links;
      
      // Map for easy access
      const nodeMap = new Map();
      nodes.forEach(n => nodeMap.set(n.id, { ...n }));
      
      let currentX = 0;
      let branchY = 0;

      // Sequential layout logic (simplified tree)
      nodes.forEach((node, i) => {
        // Skip if node already has position (preserved from previous render)
        if (node.x != null && node.y != null) return;

        // Calculate logical position
        const idealX = i * 150;
        let idealY = 0;

        if (node.isDrift) {
          branchY += 100;
          idealY = (i % 2 === 0 ? 1 : -1) * branchY;
        }

        // Apply
        node.x = idealX;
        node.y = idealY;
      });
    };

    layoutTree();
    
    // Simulation setup
    if (!simulationRef.current) {
      simulationRef.current = d3.forceSimulation()
        .force('link', d3.forceLink().id(d => d.id).distance(120).strength(0.5))
        .force('charge', d3.forceManyBody().strength(-400))
        .force('collide', d3.forceCollide().radius(d => d.radius + 20).strength(0.7))
        .force('y', d3.forceY(0).strength(0.05)); // Gentle centering
    }
    
    const simulation = simulationRef.current;
    simulation.nodes(graphData.nodes);
    simulation.force('link').links(graphData.links);
    // Low alpha target prevents "explosive" restarts
    simulation.alphaTarget(0.01).restart();

    // Draw links
    const linkGroup = mainGroup.select('g.links');
    const link = linkGroup.selectAll('path.link')
      .data(graphData.links, d => d.id)
      .join('path')
      .attr('class', 'link')
      .attr('fill', 'none')
      .attr('stroke', d => {
        if (d.type === 'contradiction') return '#ef4444';
        if (d.type === 'error') return '#f59e0b';
        if (d.type === 'weak') return '#6b7280';
        if (d.type === 'gap') return '#94a3b8';
        if (d.type === 'drift') return '#9ca3af';
        return '#cbd5e1'; // backbone
      })
      .attr('stroke-width', d => d.type === 'backbone' ? 3 : 2)
      .attr('stroke-dasharray', d => {
        if (d.type === 'weak') return '5,5';
        if (d.type === 'gap') return '8,4';
        if (d.type === 'drift') return '3,3';
        return null;
      })
      .attr('marker-end', d => {
        if (d.type === 'contradiction') return 'url(#arrow-contradiction)';
        if (d.type === 'weak') return 'url(#arrow-weak)';
        return 'url(#arrow-normal)';
      });

    // Draw nodes
    const nodeGroup = mainGroup.select('g.nodes');
    const node = nodeGroup.selectAll('g.node')
      .data(graphData.nodes, d => d.id)
      .join(
        enter => {
          const g = enter.append('g').attr('class', 'node').attr('cursor', 'pointer');
          
          g.append('circle')
            .attr('class', 'node-circle')
            .attr('r', 0)
            .attr('fill', '#fff')
            .attr('stroke-width', 3)
            .call(e => e.transition().duration(500).attr('r', d => d.radius));
          
          // Simple role indicator dot
          g.append('circle')
            .attr('r', 5)
            .attr('cx', d => d.radius * 0.7)
            .attr('cy', d => -d.radius * 0.7)
            .attr('fill', d => {
               if (d.role === 'introduce') return '#10b981';
               if (d.role === 'conclude') return '#8b5cf6';
               return 'transparent';
            });
          
          g.append('text')
            .attr('dy', '0.35em')
            .attr('text-anchor', 'middle')
            .attr('font-size', d => Math.max(10, d.radius * 0.4))
            .attr('font-weight', 'bold')
            .style('pointer-events', 'none')
            .attr('fill', d => d.color)
            .text(d => d.label);
          
          g.call(d3.drag()
            .on('start', dragstart)
            .on('drag', dragging)
            .on('end', dragend));
          
          return g;
        },
        update => {
          update.select('.node-circle')
            .transition().duration(300)
            .attr('r', d => d.radius)
            .attr('stroke', d => d.color)
            .attr('stroke-width', d => d.isDrift ? 2 : 4);
          
          update.select('text')
            .attr('fill', d => d.color)
            .text(d => d.label);
          
          return update;
        },
        exit => exit.transition().duration(300).attr('opacity', 0).remove()
      );

    node.on('click', (e, d) => { e.stopPropagation(); setSelectedNode(d); });

    // Tick function
    simulation.on('tick', () => {
      link.attr('d', d => {
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        
        if (d.type === 'contradiction') {
          const dr = Math.sqrt(dx*dx + dy*dy) * 1.5;
          return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
        }
        return `M${d.source.x},${d.source.y}L${d.target.x},${d.target.y}`;
      });
      
      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    function dragstart(e, d) {
      if (!e.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragging(e, d) {
      d.fx = e.x;
      d.fy = e.y;
    }
    
    function dragend(e, d) {
      if (!e.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => simulation.on('tick', null);
  }, [graphData, isFullscreen]);

  // Zoom controls
  const handleZoom = (factor) => {
    const svg = d3.select(svgRef.current);
    const mainGroup = svg.select('g.main-group');
    svg.transition().call(
      d3.zoom().transform,
      d3.zoomTransform(mainGroup.node()).scale(factor)
    );
  };

  const handleReset = () => {
    const svg = d3.select(svgRef.current);
    const height = isFullscreen ? window.innerHeight - 100 : 600;
    // Reset view to center based on node count
    const centerOffset = (graphData.nodes.length * 60);
    svg.transition().call(
      d3.zoom().transform,
      d3.zoomIdentity.translate(450 - centerOffset, height/2).scale(0.8)
    );
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const LegendItem = ({ color, label, icon: Icon, strokeDash }) => (
    <div className="flex items-center gap-2 text-[10px] text-gray-600">
      {Icon ? (
        <Icon className="w-3 h-3" style={{ color }} />
      ) : strokeDash ? (
        <svg width="16" height="4" className="flex-shrink-0">
          <line x1="0" y1="2" x2="16" y2="2" stroke={color} strokeWidth="2" strokeDasharray={strokeDash} />
        </svg>
      ) : (
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      )}
      <span>{label}</span>
    </div>
  );

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col ${isFullscreen ? 'fixed inset-0 z-50' : 'h-full'} relative group`}>
      {/* Header - Transparent/Minimal to fix white bar issue */}
      <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-white z-10">
        <div>
          <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
            <GitBranch className="w-4 h-4 text-blue-600" /> Explanation Graph
          </h3>
        </div>
        <div className="flex gap-1">
          <button onClick={() => handleZoom(1.2)} className="p-1 hover:bg-gray-100 rounded">
            <ZoomIn className="w-3.5 h-3.5 text-gray-600"/>
          </button>
          <button onClick={() => handleZoom(0.8)} className="p-1 hover:bg-gray-100 rounded">
            <ZoomOut className="w-3.5 h-3.5 text-gray-600"/>
          </button>
          <button onClick={handleReset} className="p-1 hover:bg-gray-100 rounded">
            <RefreshCw className="w-3.5 h-3.5 text-gray-600"/>
          </button>
          <button onClick={toggleFullscreen} className="p-1 hover:bg-gray-100 rounded">
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-gray-600"/> : <Maximize2 className="w-3.5 h-3.5 text-gray-600"/>}
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className={`relative flex-1 ${isFullscreen ? 'h-full' : 'min-h-[500px]'} bg-slate-50/30`} ref={containerRef}>
        <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing"></svg>
        
        {/* Legend - Removed backdrop blur to fix overlapping glitches */}
        <div className="absolute top-4 right-4 bg-white/90 px-3 py-2 rounded-lg border border-gray-200 shadow-sm pointer-events-none select-none z-0 max-w-xs">
          <div className="text-[10px] font-bold text-gray-700 mb-1">Structure</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-2">
            <LegendItem color="#3b82f6" label="Flow" strokeDash={null} />
            <LegendItem color="#ef4444" label="Conflict" icon={AlertTriangle} />
            <LegendItem color="#9ca3af" label="Drift" strokeDash="3,3" />
          </div>
          <div className="text-[10px] font-bold text-gray-700 mb-1">Issues</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <LegendItem color="#10b981" label="Good" icon={CheckCircle} />
            <LegendItem color="#3b82f6" label="Clarity" />
            <LegendItem color="#ef4444" label="Accuracy" />
            <LegendItem color="#f59e0b" label="Pacing" />
          </div>
        </div>

        {/* Selected Node Panel */}
        {selectedNode && (
          <div className="absolute bottom-4 left-4 w-72 bg-white shadow-xl border border-gray-200 rounded-lg p-4 animate-in slide-in-from-bottom-2 z-20">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <span 
                  className="px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase" 
                  style={{ backgroundColor: selectedNode.color }}
                >
                  {selectedNode.primaryIssue === 'good' ? '✓ Good' : selectedNode.primaryIssue}
                </span>
                <span className="font-bold text-gray-900 text-xs">Segment {selectedNode.id + 1}</span>
              </div>
              <button onClick={() => setSelectedNode(null)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-gray-600 text-xs line-clamp-3 leading-relaxed mb-2">"{selectedNode.fullText}"</p>
            
            <div className="flex items-center gap-3 text-[10px] text-gray-500 font-medium border-t pt-2 border-gray-100">
              <span>Score: <span className="text-gray-900 font-bold">{selectedNode.score.toFixed(1)}</span></span>
              {selectedNode.isDrift && <span className="text-yellow-600 bg-yellow-50 px-1 rounded">Topic Drift</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExplanationGraph;