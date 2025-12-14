import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  GitBranch, AlertTriangle, XCircle, ZoomIn, ZoomOut, RefreshCw,
  CheckCircle, TrendingUp, Minimize2, Maximize2
} from 'lucide-react';

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
        const response = await fetch(`/api/coherence/${sessionId}`);
        const data = await response.json();
        setCoherenceData(data);
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
    if (!segments || segments.length === 0) return { nodes: [], links: [], clusters: [] };

    const drifts = coherenceData?.topic_drifts || [];
    const contradictions = coherenceData?.contradictions || [];
    const gaps = coherenceData?.logical_gaps || [];

    // Helper: Calculate semantic similarity (mock - in production use embeddings)
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
      const lowest = Object.entries(scores).sort((a, b) => a[1] - b[1])[0];
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
      
      // Calculate node size based on score (radius 15-40)
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
        isRoot: i === 0 || (i > 0 && calculateSimilarity(seg, segments[i-1]) < 0.3),
        isDeadEnd: i === segments.length - 1 || (i < segments.length - 1 && calculateSimilarity(seg, segments[i+1]) < 0.2),
      };

      // Preserve physics state
      const prev = nodesRef.current.find(n => n.id === node.id);
      if (prev) {
        node.x = prev.x;
        node.y = prev.y;
        node.vx = prev.vx;
        node.vy = prev.vy;
      }
      return node;
    });

    nodesRef.current = nodes;

    // Create links with enhanced metadata
    const links = [];
    
    // Sequential links (backbone and branches)
    for (let i = 0; i < nodes.length - 1; i++) {
      const source = nodes[i];
      const target = nodes[i + 1];
      const similarity = calculateSimilarity(segments[i], segments[i + 1]);
      
      // Check for logical gap
      const gap = gaps.find(g => 
        (g.between_segment1 === source.id && g.between_segment2 === target.id) ||
        (g.between_segment1 === target.id && g.between_segment2 === source.id)
      );
      
      // Determine link type
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

    // Detect clusters (simplified - group by semantic similarity)
    const clusters = [];
    let currentCluster = [nodes[0]];
    for (let i = 1; i < nodes.length; i++) {
      const sim = calculateSimilarity(segments[i], segments[i-1]);
      if (sim > 0.5) {
        currentCluster.push(nodes[i]);
      } else {
        if (currentCluster.length > 0) clusters.push([...currentCluster]);
        currentCluster = [nodes[i]];
      }
    }
    if (currentCluster.length > 0) clusters.push(currentCluster);

    return { nodes, links, clusters };
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
      
      // Layers (order matters for z-index)
      mainGroup.append('g').attr('class', 'clusters');
      mainGroup.append('g').attr('class', 'links');
      mainGroup.append('g').attr('class', 'nodes');

      // Zoom behavior
      const zoom = d3.zoom()
        .scaleExtent([0.1, 4])
        .on('zoom', (event) => mainGroup.attr('transform', event.transform));
      
      svg.call(zoom)
         .call(zoom.transform, d3.zoomIdentity.translate(100, height/2).scale(0.7));

      // Arrow markers
      const defs = svg.append('defs');
      
      // Normal arrow
      defs.append('marker').attr('id', 'arrow-normal')
        .attr('viewBox','0 -5 10 10').attr('refX',28).attr('refY',0)
        .attr('markerWidth',6).attr('markerHeight',6).attr('orient','auto')
        .append('path').attr('d','M0,-5L10,0L0,5').attr('fill','#94a3b8');
      
      // Contradiction arrow (red)
      defs.append('marker').attr('id', 'arrow-contradiction')
        .attr('viewBox','0 -5 10 10').attr('refX',28).attr('refY',0)
        .attr('markerWidth',8).attr('markerHeight',8).attr('orient','auto')
        .append('path').attr('d','M0,-5L10,0L0,5').attr('fill','#ef4444');
      
      // Weak arrow (dashed)
      defs.append('marker').attr('id', 'arrow-weak')
        .attr('viewBox','0 -5 10 10').attr('refX',28).attr('refY',0)
        .attr('markerWidth',5).attr('markerHeight',5).attr('orient','auto')
        .append('path').attr('d','M0,-5L10,0L0,5').attr('fill','#6b7280');
    }

    // Use force simulation for layout
    if (!simulationRef.current) {
      simulationRef.current = d3.forceSimulation()
        .force('link', d3.forceLink().id(d => d.id).distance(120).strength(0.4))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(d => d.radius + 20));
    }
    
    const simulation = simulationRef.current;
    simulation.nodes(graphData.nodes);
    simulation.force('link').links(graphData.links);
    simulation.alpha(0.1).restart();

    // Draw cluster backgrounds (as branch backgrounds)
    const clusterGroup = mainGroup.select('g.clusters');
    const cluster = clusterGroup.selectAll('rect.cluster')
      .data(graphData.clusters, (d, i) => i)
      .join('rect')
      .attr('class', 'cluster')
      .attr('width', d => d.length * 140)
      .attr('height', 80)
      .attr('rx', 12)
      .attr('fill', 'rgba(59, 130, 246, 0.03)')
      .attr('stroke', 'rgba(59, 130, 246, 0.15)')
      .attr('stroke-width', 1);

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
        return '#3b82f6'; // backbone
      })
      .attr('stroke-width', d => {
        if (d.type === 'backbone') return 4;
        if (d.type === 'contradiction') return 3;
        return 2;
      })
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
      })
      .attr('opacity', d => d.type === 'contradiction' ? 0.8 : 0.6);

    // Draw nodes
    const nodeGroup = mainGroup.select('g.nodes');
    const node = nodeGroup.selectAll('g.node')
      .data(graphData.nodes, d => d.id)
      .join(
        enter => {
          const g = enter.append('g').attr('class', 'node').attr('cursor', 'pointer');
          
          // Main circle
          g.append('circle')
            .attr('class', 'node-circle')
            .attr('r', 0)
            .attr('fill', '#fff')
            .attr('stroke-width', 4)
            .call(e => e.transition().duration(500).attr('r', d => d.radius));
          
          // Role indicator (small icon)
          g.append('circle')
            .attr('class', 'role-indicator')
            .attr('r', 4)
            .attr('cx', d => d.radius * 0.7)
            .attr('cy', d => -d.radius * 0.7)
            .attr('fill', d => {
              if (d.role === 'introduce') return '#10b981';
              if (d.role === 'conclude') return '#8b5cf6';
              if (d.role === 'anomaly') return '#ef4444';
              return '#3b82f6';
            });
          
          // Dead end indicator (X mark at end of branch)
          g.filter(d => d.isDeadEnd).append('g')
            .attr('class', 'dead-end')
            .attr('transform', d => `translate(${d.radius + 8}, 0)`)
            .call(g => {
              g.append('circle')
                .attr('r', 8)
                .attr('fill', '#fee2e2')
                .attr('stroke', '#ef4444')
                .attr('stroke-width', 2);
              g.append('path')
                .attr('d', 'M-4,-4 L4,4 M4,-4 L-4,4')
                .attr('stroke', '#ef4444')
                .attr('stroke-width', 2)
                .attr('stroke-linecap', 'round');
            });
          
          // Label
          g.append('text')
            .attr('dy', '0.35em')
            .attr('text-anchor', 'middle')
            .attr('font-size', d => Math.max(10, d.radius * 0.35))
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
      link.attr('d', d => `M${d.source.x},${d.source.y}L${d.target.x},${d.target.y}`);
      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    function dragstart(e, d) {
      if (!e.active) simulation.alphaTarget(0.1).restart();
    }

    function dragging(e, d) {
      d.x = e.x;
      d.y = e.y;
    }

    function dragend(e, d) {
      if (!e.active) simulation.alphaTarget(0);
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
    const width = containerRef.current?.clientWidth || 900;
    const height = isFullscreen ? window.innerHeight - 100 : 600;
    svg.transition().call(
      d3.zoom().transform,
      d3.zoomIdentity.translate(100, height/2).scale(0.7)
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
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-white/80 backdrop-blur-sm z-20">
        <div>
          <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
            <GitBranch className="w-4 h-4 text-blue-600" /> Advanced Explanation Graph
          </h3>
        </div>
        <div className="flex gap-1">
          <button onClick={() => handleZoom(1.2)} className="p-1 hover:bg-gray-100 rounded" title="Zoom In">
            <ZoomIn className="w-3.5 h-3.5 text-gray-600"/>
          </button>
          <button onClick={() => handleZoom(0.8)} className="p-1 hover:bg-gray-100 rounded" title="Zoom Out">
            <ZoomOut className="w-3.5 h-3.5 text-gray-600"/>
          </button>
          <button onClick={handleReset} className="p-1 hover:bg-gray-100 rounded" title="Reset View">
            <RefreshCw className="w-3.5 h-3.5 text-gray-600"/>
          </button>
          <button onClick={toggleFullscreen} className="p-1 hover:bg-gray-100 rounded" title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-gray-600"/> : <Maximize2 className="w-3.5 h-3.5 text-gray-600"/>}
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className={`relative flex-1 ${isFullscreen ? 'h-full' : 'min-h-[600px]'} bg-slate-50/50`} ref={containerRef}>
        <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing"></svg>
        
        {/* Legend - Top Right */}
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3 py-2 rounded-lg border border-gray-200 shadow-sm pointer-events-none select-none z-10 max-w-xs">
          <div className="text-[10px] font-bold text-gray-700 mb-2">Link Types</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <LegendItem color="#3b82f6" label="Backbone" strokeDash={null} />
            <LegendItem color="#ef4444" label="Contradiction" icon={AlertTriangle} />
            <LegendItem color="#f59e0b" label="Error Branch" />
            <LegendItem color="#6b7280" label="Weak Transition" strokeDash="5,5" />
            <LegendItem color="#94a3b8" label="Logical Gap" strokeDash="8,4" />
            <LegendItem color="#9ca3af" label="Topic Drift" strokeDash="3,3" />
          </div>
          <div className="text-[10px] font-bold text-gray-700 mt-2 mb-1">Node Colors (Issues)</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <LegendItem color="#10b981" label="Good" icon={CheckCircle} />
            <LegendItem color="#3b82f6" label="Clarity" />
            <LegendItem color="#8b5cf6" label="Structure" />
            <LegendItem color="#ef4444" label="Correctness" />
            <LegendItem color="#f59e0b" label="Pacing" />
            <LegendItem color="#ec4899" label="Communication" />
          </div>
        </div>

        {/* Selected Node Panel */}
        {selectedNode && (
          <div className="absolute bottom-4 left-4 w-72 bg-white/95 backdrop-blur-md shadow-xl border border-gray-200 rounded-lg p-4 animate-in slide-in-from-bottom-2 z-20 max-h-80 overflow-y-auto">
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
            
            <div className="text-[10px] text-gray-500 mb-2 flex items-center gap-2">
              <span className="px-2 py-0.5 bg-gray-100 rounded">Role: {selectedNode.role}</span>
              {selectedNode.isRoot && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">Root</span>}
              {selectedNode.isDeadEnd && <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded">Dead End</span>}
              {selectedNode.isDrift && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded">Drift</span>}
            </div>
            
            <p className="text-gray-600 text-xs line-clamp-4 leading-relaxed mb-2">"{selectedNode.fullText}"</p>
            
            <div className="flex items-center gap-3 text-[10px] text-gray-500 font-medium border-t pt-2 border-gray-100">
              <span>Score: <span className="text-gray-900 font-bold">{selectedNode.score.toFixed(1)}</span></span>
              <span>Size: <span className="text-gray-900">{Math.round(selectedNode.radius)}</span></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExplanationGraph;