// frontend/src/components/ExplanationGraph.jsx
import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  GitBranch, ArrowRight, HelpCircle, 
  AlertTriangle, XCircle, ZoomIn, ZoomOut, RefreshCw 
} from 'lucide-react';
import apiClient from '../api/client';

const ExplanationGraph = ({ segments, sessionId, coherenceData: initialCoherenceData }) => {
  const svgRef = useRef();
  const containerRef = useRef();
  // Store simulation to stop it on unmount
  const simulationRef = useRef();
  
  const [coherenceData, setCoherenceData] = useState(initialCoherenceData);
  const [loading, setLoading] = useState(!initialCoherenceData && !!sessionId);
  const [selectedNode, setSelectedNode] = useState(null);

  // Fetch coherence data
  useEffect(() => {
    const fetchCoherence = async () => {
      if (!sessionId || initialCoherenceData) return;
      try {
        setLoading(true);
        const res = await apiClient.get(`/api/coherence/${sessionId}`);
        setCoherenceData(res.data);
      } catch (error) {
        // Fallback if no coherence data
        setCoherenceData({ contradictions: [], topic_drifts: [], logical_gaps: [] });
      } finally {
        setLoading(false);
      }
    };
    fetchCoherence();
  }, [sessionId, initialCoherenceData]);

  // Keep state synced
  useEffect(() => {
    if (initialCoherenceData) setCoherenceData(initialCoherenceData);
  }, [initialCoherenceData]);

  // Transform Data for Graph
  const graphData = useMemo(() => {
    if (!segments || segments.length === 0) return { nodes: [], links: [] };

    const drifts = coherenceData?.topic_drifts || [];
    const contradictions = coherenceData?.contradictions || [];
    const gaps = coherenceData?.logical_gaps || [];

    // Helper: Issue Color
    const getIssueDetails = (seg) => {
      const metrics = {
        clarity: seg.clarity?.score || 10,
        structure: seg.structure?.score || 10,
        correctness: seg.correctness?.score || 10,
        pacing: seg.pacing?.score || 10,
        communication: seg.communication?.score || 10,
      };
      
      const entries = Object.entries(metrics).sort((a, b) => a[1] - b[1]);
      const lowest = entries[0];

      if (lowest[1] >= 7.5) return { type: 'good', color: '#10b981', label: 'Good' }; 
      
      const colorMap = {
        clarity: '#3b82f6',     
        structure: '#8b5cf6',   
        correctness: '#ef4444', 
        pacing: '#f59e0b',      
        communication: '#ec4899'
      };

      return { type: lowest[0], color: colorMap[lowest[0]] || '#6b7280', label: lowest[0] };
    };

    // Helper: Role
    const getRole = (index, total, seg) => {
      if (index === 0) return 'Introduce';
      if (index === total - 1) return 'Conclude';
      if (seg.overall_segment_score < 4) return 'Anomaly';
      return 'Elaborate'; 
    };

    // Create Nodes
    const nodes = segments.map((seg, i) => {
      const issue = getIssueDetails(seg);
      const role = getRole(i, segments.length, seg);
      const driftItem = drifts.find(d => d.segment_id === seg.segment_id);
      
      return {
        id: seg.segment_id, // Stable ID is crucial for D3
        label: `S${seg.segment_id + 1}`,
        fullText: seg.text,
        score: seg.overall_segment_score,
        metrics: seg,
        radius: 20 + (seg.overall_segment_score * 1.5),
        color: issue.color,
        issueType: issue.type,
        role: role,
        isDrift: !!driftItem,
        driftDegree: driftItem ? driftItem.drift_degree : 0,
        
        // Initial position helpers (d3 will overwrite x/y, but we can hint)
        fx: null, // Ensure not fixed unless dragged
        fy: null
      };
    });

    // Create Links
    const links = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      const source = nodes[i];
      const target = nodes[i + 1];
      const gap = gaps.find(g => 
        (g.between_segment1 === source.id && g.between_segment2 === target.id) ||
        (g.between_segment1 === target.id && g.between_segment2 === source.id)
      );

      links.push({
        source: source.id,
        target: target.id,
        type: gap ? 'gap' : 'normal',
        gapSeverity: gap?.severity,
        id: `${source.id}-${target.id}` // Stable Link ID
      });
    }

    contradictions.forEach((c, idx) => {
      const s = nodes.find(n => n.id === c.segment1_id);
      const t = nodes.find(n => n.id === c.segment2_id);
      if (s && t) {
        links.push({
          source: s.id,
          target: t.id,
          type: 'contradiction',
          severity: c.severity,
          id: `contra-${idx}`
        });
      }
    });

    return { nodes, links };
  }, [segments, coherenceData]); // Only re-calc if data deeply changes

  // D3 Rendering
  useEffect(() => {
    if (!graphData.nodes.length || !svgRef.current) return;

    const width = containerRef.current?.clientWidth || 900;
    const height = 500;

    const svg = d3.select(svgRef.current);
    
    // 1. Setup Zoom/Pan container (Only once)
    let g = svg.select('g.main-group');
    if (g.empty()) {
      g = svg.append('g').attr('class', 'main-group');
      
      // Initialize Zoom
      const zoom = d3.zoom()
        .scaleExtent([0.1, 4])
        .on('zoom', (event) => {
          g.attr('transform', event.transform);
        });
        
      svg.call(zoom)
         // Center initially
         .call(zoom.transform, d3.zoomIdentity.translate(width/2, height/2).scale(0.8));
    }

    // 2. Define Arrowheads (Only once)
    let defs = svg.select('defs');
    if (defs.empty()) {
      defs = svg.append('defs');
      
      defs.append('marker')
        .attr('id', 'arrow-normal')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 32) // Pushed back slightly
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#94a3b8');

      defs.append('marker')
        .attr('id', 'arrow-contradiction')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 28)
        .attr('refY', 0)
        .attr('markerWidth', 8)
        .attr('markerHeight', 8)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#ef4444');
    }

    // 3. Force Simulation Setup
    // We restart simulation only if it doesn't exist, otherwise we reheat it slightly
    if (!simulationRef.current) {
      simulationRef.current = d3.forceSimulation()
        .force('link', d3.forceLink().id(d => d.id).distance(120))
        .force('charge', d3.forceManyBody().strength(-400))
        .force('collide', d3.forceCollide().radius(d => d.radius + 15))
        .force('x', d3.forceX(d => (d.id * 100) - (graphData.nodes.length * 50)).strength(0.5))
        .force('y', d3.forceY(d => d.isDrift ? (d.driftDegree * 200 * (d.id % 2 ? 1 : -1)) : 0).strength(0.5));
    }

    const simulation = simulationRef.current;

    // Update nodes/links data in simulation
    // This preserves internal state (x,y,v) of existing nodes!
    simulation.nodes(graphData.nodes);
    simulation.force('link').links(graphData.links);

    // Reheat simulation slightly to let new nodes settle, but don't reset fully
    simulation.alpha(0.3).restart();

    // 4. Draw Links (Update Pattern)
    const link = g.selectAll('path.link')
      .data(graphData.links, d => d.id)
      .join(
        enter => enter.append('path')
          .attr('class', 'link')
          .attr('fill', 'none')
          .attr('stroke-width', 0) // Animate in
          .call(enter => enter.transition().duration(500).attr('stroke-width', d => d.type === 'contradiction' ? 2 : 3)),
        update => update,
        exit => exit.transition().duration(500).attr('opacity', 0).remove()
      )
      .attr('stroke', d => d.type === 'contradiction' ? '#ef4444' : '#cbd5e1')
      .attr('stroke-dasharray', d => d.type === 'gap' ? '5,5' : null)
      .attr('marker-end', d => d.type === 'contradiction' ? 'url(#arrow-contradiction)' : 'url(#arrow-normal)');

    // 5. Draw Nodes (Update Pattern)
    const node = g.selectAll('g.node')
      .data(graphData.nodes, d => d.id)
      .join(
        enter => {
          const group = enter.append('g')
            .attr('class', 'node')
            .attr('cursor', 'pointer')
            .call(d3.drag()
              .on('start', dragstarted)
              .on('drag', dragged)
              .on('end', dragended));
            
          group.append('circle')
            .attr('r', 0) // Animate grow
            .attr('fill', '#fff')
            .transition().duration(500)
            .attr('r', d => d.radius);

          group.append('foreignObject')
            .attr('width', d => d.radius * 2)
            .attr('height', d => d.radius * 2)
            .attr('x', d => -d.radius)
            .attr('y', d => -d.radius)
            .style('pointer-events', 'none')
            .append('xhtml:div')
            .style('width', '100%')
            .style('height', '100%')
            .style('display', 'flex')
            .style('align-items', 'center')
            .style('justify-content', 'center')
            .html(d => `<span style="font-weight:700; font-size:${d.radius*0.5}px; color:${d.color}">${d.label}</span>`);

          return group;
        },
        update => {
          // Update colors/radius if score changed
          update.select('circle')
            .transition().duration(300)
            .attr('r', d => d.radius)
            .attr('stroke', d => d.color)
            .attr('stroke-width', d => d.isDrift ? 2 : 4);
          
          return update;
        },
        exit => exit.transition().duration(500).attr('opacity', 0).remove()
      );

    // Initial styling update for all nodes
    node.select('circle')
      .attr('stroke', d => d.color)
      .attr('stroke-width', d => d.isDrift ? 2 : 4);

    node.on('click', (e, d) => {
      e.stopPropagation();
      setSelectedNode(d);
    });

    // 6. Tick Function
    simulation.on('tick', () => {
      link.attr('d', d => {
        if (d.type === 'contradiction') {
          const dx = d.target.x - d.source.x;
          const dy = d.target.y - d.source.y;
          const dr = Math.sqrt(dx * dx + dy * dy);
          return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
        }
        return `M${d.source.x},${d.source.y}L${d.target.x},${d.target.y}`;
      });

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Drag Interaction
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }
    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Cleanup
    return () => {
      // Don't stop simulation entirely to allow smooth transitions, 
      // but remove listener to prevent mem leak if unmounted
      simulation.on('tick', null);
    };

  }, [graphData]); // Only re-run if graph structure changes

  // Manual Zoom Controls
  const handleZoom = (factor) => {
    const svg = d3.select(svgRef.current);
    const zoom = d3.zoom().on('zoom', (e) => svg.select('g.main-group').attr('transform', e.transform));
    svg.transition().call(zoom.scaleBy, factor);
  };

  const handleResetZoom = () => {
    const svg = d3.select(svgRef.current);
    const zoom = d3.zoom().on('zoom', (e) => svg.select('g.main-group').attr('transform', e.transform));
    svg.transition().call(zoom.transform, d3.zoomIdentity.translate(450, 250).scale(0.8));
  };

  const LegendItem = ({ color, label, icon: Icon }) => (
    <div className="flex items-center gap-2 text-xs text-gray-600">
      {Icon ? <Icon className="w-4 h-4" style={{ color }} /> : <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />}
      <span>{label}</span>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
        <div>
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-blue-600" />
            Explanation Flow Structure
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Visual analysis of teaching logic. Scroll to zoom, drag to pan.
          </p>
        </div>
        <div className="flex gap-2">
           <button onClick={() => handleZoom(1.2)} className="p-1 hover:bg-white rounded border border-transparent hover:border-gray-200"><ZoomIn className="w-4 h-4 text-gray-600"/></button>
           <button onClick={() => handleZoom(0.8)} className="p-1 hover:bg-white rounded border border-transparent hover:border-gray-200"><ZoomOut className="w-4 h-4 text-gray-600"/></button>
           <button onClick={handleResetZoom} className="p-1 hover:bg-white rounded border border-transparent hover:border-gray-200"><RefreshCw className="w-4 h-4 text-gray-600"/></button>
        </div>
      </div>

      <div className="relative flex-1 min-h-[500px]" ref={containerRef}>
        <svg ref={svgRef} className="w-full h-full bg-slate-50/30 cursor-grab active:cursor-grabbing"></svg>
        
        {/* Legend */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg border border-gray-200 shadow-sm text-sm space-y-3 pointer-events-none">
          <div>
            <span className="font-semibold text-xs text-gray-900 block mb-2">Dominant Issues</span>
            <div className="grid grid-cols-2 gap-2">
              <LegendItem color="#3b82f6" label="Clarity" />
              <LegendItem color="#8b5cf6" label="Structure" />
              <LegendItem color="#ef4444" label="Correctness" />
              <LegendItem color="#f59e0b" label="Pacing" />
            </div>
          </div>
          <div className="border-t pt-2">
            <span className="font-semibold text-xs text-gray-900 block mb-2">Structure</span>
            <div className="space-y-1">
              <LegendItem icon={ArrowRight} color="#94a3b8" label="Flow (Solid)" />
              <LegendItem icon={HelpCircle} color="#94a3b8" label="Weak Link (Dashed)" />
              <LegendItem icon={GitBranch} color="#64748b" label="Topic Drift (Branch)" />
              <LegendItem icon={AlertTriangle} color="#ef4444" label="Contradiction (Red)" />
            </div>
          </div>
        </div>

        {/* Selected Node Panel */}
        {selectedNode && (
          <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur shadow-lg border border-gray-200 rounded-xl p-4 animate-in slide-in-from-bottom-2">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold text-white`} style={{ backgroundColor: selectedNode.color }}>
                    {selectedNode.label}
                  </span>
                  <span className="font-bold text-gray-900">Segment {selectedNode.id + 1}</span>
                  <span className="text-gray-500 text-xs uppercase tracking-wider border px-1 rounded">
                    {selectedNode.role}
                  </span>
                </div>
                <p className="text-gray-600 text-sm line-clamp-2 italic mb-2">"{selectedNode.fullText}"</p>
                <div className="flex gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500">Score:</span>
                    <span className="font-bold">{selectedNode.score.toFixed(1)}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedNode(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExplanationGraph;