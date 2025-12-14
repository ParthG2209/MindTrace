// parthg2209/mindtrace/MindTrace-454002ad537de541ce806a44cdbebf379fec4615/frontend/src/components/ExplanationGraph.jsx

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  GitBranch, ArrowRight, HelpCircle, 
  AlertTriangle, XCircle, ZoomIn, ZoomOut, RefreshCw 
} from 'lucide-react';
import apiClient from '../api/client';

// Helper for deep comparison to prevent unnecessary re-renders
const useDeepCompareMemo = (factory, deps) => {
  const ref = useRef(undefined);
  if (!ref.current || !isDeepEqual(ref.current.deps, deps)) {
    ref.current = { deps, value: factory() };
  }
  return ref.current.value;
};

const isDeepEqual = (a, b) => {
  return JSON.stringify(a) === JSON.stringify(b);
};

const ExplanationGraph = ({ segments, sessionId, coherenceData: initialCoherenceData }) => {
  const svgRef = useRef();
  const containerRef = useRef();
  const simulationRef = useRef();
  const nodesRef = useRef([]); // Keeps track of node positions
  
  const [coherenceData, setCoherenceData] = useState(initialCoherenceData);
  const [loading, setLoading] = useState(!initialCoherenceData && !!sessionId);
  const [selectedNode, setSelectedNode] = useState(null);

  // 1. Fetch coherence data (only if missing)
  useEffect(() => {
    const fetchCoherence = async () => {
      if (!sessionId || initialCoherenceData) return;
      try {
        setLoading(true);
        const res = await apiClient.get(`/api/coherence/${sessionId}`);
        setCoherenceData(res.data);
      } catch (error) {
        setCoherenceData({ contradictions: [], topic_drifts: [], logical_gaps: [] });
      } finally {
        setLoading(false);
      }
    };
    fetchCoherence();
  }, [sessionId, initialCoherenceData]);

  // Sync prop changes
  useEffect(() => {
    if (initialCoherenceData) setCoherenceData(initialCoherenceData);
  }, [initialCoherenceData]);

  // 2. Process Data (Memoized with Deep Compare to stop "twitching")
  const graphData = useDeepCompareMemo(() => {
    if (!segments || segments.length === 0) return { nodes: [], links: [] };

    const drifts = coherenceData?.topic_drifts || [];
    const contradictions = coherenceData?.contradictions || [];
    const gaps = coherenceData?.logical_gaps || [];

    // Map segments to nodes
    const newNodes = segments.map((seg, i) => {
      const metrics = {
        clarity: seg.clarity?.score || 10,
        structure: seg.structure?.score || 10,
        correctness: seg.correctness?.score || 10,
        pacing: seg.pacing?.score || 10,
        communication: seg.communication?.score || 10,
      };
      
      const entries = Object.entries(metrics).sort((a, b) => a[1] - b[1]);
      const lowest = entries[0];
      
      let issueColor = lowest[1] >= 7.5 ? '#10b981' : (
        {
          clarity: '#3b82f6', structure: '#8b5cf6', correctness: '#ef4444', 
          pacing: '#f59e0b', communication: '#ec4899'
        }[lowest[0]] || '#6b7280'
      );

      const driftItem = drifts.find(d => d.segment_id === seg.segment_id);

      const node = {
        id: seg.segment_id, // Stable ID
        label: `S${seg.segment_id + 1}`,
        fullText: seg.text,
        score: seg.overall_segment_score,
        radius: 20 + (seg.overall_segment_score * 1.5),
        color: issueColor,
        issueType: lowest[1] >= 7.5 ? 'Good' : lowest[0],
        isDrift: !!driftItem,
        driftDegree: driftItem ? driftItem.drift_degree : 0,
      };

      // CRITICAL FIX: Copy previous physics state (x, y, velocity, fixed pos)
      // This prevents the "collapse to center" effect on updates
      const prev = nodesRef.current.find(n => n.id === node.id);
      if (prev) {
        node.x = prev.x;
        node.y = prev.y;
        node.vx = prev.vx;
        node.vy = prev.vy;
        node.fx = prev.fx; // Preserve drag position
        node.fy = prev.fy;
      }
      return node;
    });

    // Update ref for next render
    nodesRef.current = newNodes;

    // Create Links
    const links = [];
    for (let i = 0; i < newNodes.length - 1; i++) {
      const s = newNodes[i];
      const t = newNodes[i + 1];
      const gap = gaps.find(g => 
        (g.between_segment1 === s.id && g.between_segment2 === t.id) ||
        (g.between_segment1 === t.id && g.between_segment2 === s.id)
      );
      links.push({ source: s.id, target: t.id, type: gap ? 'gap' : 'normal', id: `link-${s.id}-${t.id}` });
    }

    contradictions.forEach((c, idx) => {
      const s = newNodes.find(n => n.id === c.segment1_id);
      const t = newNodes.find(n => n.id === c.segment2_id);
      if (s && t) links.push({ source: s.id, target: t.id, type: 'contradiction', id: `contra-${idx}` });
    });

    return { nodes: newNodes, links };
  }, [segments, coherenceData]);

  // 3. D3 Rendering
  useEffect(() => {
    if (!graphData.nodes.length || !svgRef.current) return;

    const width = containerRef.current?.clientWidth || 900;
    const height = 500;
    const svg = d3.select(svgRef.current);
    
    // -- Setup Layers (Strict Ordering) --
    let mainGroup = svg.select('g.main-group');
    if (mainGroup.empty()) {
      mainGroup = svg.append('g').attr('class', 'main-group');
      mainGroup.append('g').attr('class', 'links'); // Bottom layer
      mainGroup.append('g').attr('class', 'nodes'); // Top layer

      // Zoom
      const zoom = d3.zoom()
        .scaleExtent([0.1, 4])
        .on('zoom', (event) => mainGroup.attr('transform', event.transform));
      
      svg.call(zoom)
         .call(zoom.transform, d3.zoomIdentity.translate(width/2, height/2).scale(0.8));

      // Markers
      const defs = svg.append('defs');
      defs.append('marker').attr('id', 'arrow-norm').attr('viewBox','0 -5 10 10').attr('refX',34).attr('refY',0).attr('markerWidth',6).attr('markerHeight',6).attr('orient','auto').append('path').attr('d','M0,-5L10,0L0,5').attr('fill','#94a3b8');
      defs.append('marker').attr('id', 'arrow-err').attr('viewBox','0 -5 10 10').attr('refX',30).attr('refY',0).attr('markerWidth',8).attr('markerHeight',8).attr('orient','auto').append('path').attr('d','M0,-5L10,0L0,5').attr('fill','#ef4444');
    }

    // -- Simulation --
    if (!simulationRef.current) {
      simulationRef.current = d3.forceSimulation()
        .force('link', d3.forceLink().id(d => d.id).distance(100))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('collide', d3.forceCollide().radius(d => d.radius + 10))
        .force('x', d3.forceX(d => (d.id * 100) - (graphData.nodes.length * 50)).strength(0.8))
        .force('y', d3.forceY(d => d.isDrift ? (d.driftDegree * 150 * (d.id % 2 ? 1 : -1)) : 0).strength(0.6));
    }
    
    const simulation = simulationRef.current;
    simulation.nodes(graphData.nodes);
    simulation.force('link').links(graphData.links);
    
    // Gentle restart only (prevents explosion)
    simulation.alphaTarget(0.01).restart();

    // -- Draw Elements --
    const linkGroup = mainGroup.select('g.links');
    const nodeGroup = mainGroup.select('g.nodes');

    // Links
    const link = linkGroup.selectAll('path.link')
      .data(graphData.links, d => d.id)
      .join(
        enter => enter.append('path').attr('class', 'link').attr('fill', 'none').attr('stroke-width', 0)
          .call(e => e.transition().duration(500).attr('stroke-width', d => d.type === 'contradiction' ? 2 : 3)),
        update => update,
        exit => exit.remove()
      )
      .attr('stroke', d => d.type === 'contradiction' ? '#ef4444' : '#cbd5e1')
      .attr('stroke-dasharray', d => d.type === 'gap' ? '5,5' : null)
      .attr('marker-end', d => d.type === 'contradiction' ? 'url(#arrow-err)' : 'url(#arrow-norm)');

    // Nodes (Pure SVG)
    const node = nodeGroup.selectAll('g.node')
      .data(graphData.nodes, d => d.id)
      .join(
        enter => {
          const g = enter.append('g').attr('class', 'node').attr('cursor', 'pointer');
          g.append('circle').attr('r', 0).attr('fill', '#fff')
            .call(e => e.transition().duration(500).attr('r', d => d.radius));
          g.append('text').attr('dy', '0.35em').attr('text-anchor', 'middle')
            .attr('font-size', d => Math.max(10, d.radius * 0.4)).attr('font-weight', 'bold')
            .style('pointer-events', 'none').attr('fill', d => d.color).text(d => d.label);
          g.call(d3.drag().on('start', dragstart).on('drag', dragging).on('end', dragend));
          return g;
        },
        update => {
          update.select('circle').transition().duration(300)
            .attr('r', d => d.radius).attr('stroke', d => d.color).attr('stroke-width', d => d.isDrift ? 2 : 4);
          update.select('text').attr('fill', d => d.color).text(d => d.label);
          return update;
        },
        exit => exit.transition().duration(300).attr('opacity', 0).remove()
      );

    // Initial styling
    node.select('circle').attr('stroke', d => d.color).attr('stroke-width', d => d.isDrift ? 2 : 4);

    node.on('click', (e, d) => { e.stopPropagation(); setSelectedNode(d); });

    // Tick
    simulation.on('tick', () => {
      link.attr('d', d => {
        if (d.type === 'contradiction') {
          const dx = d.target.x - d.source.x, dy = d.target.y - d.source.y, dr = Math.sqrt(dx*dx + dy*dy);
          return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
        }
        return `M${d.source.x},${d.source.y}L${d.target.x},${d.target.y}`;
      });
      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    function dragstart(e, d) { if (!e.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; }
    function dragging(e, d) { d.fx = e.x; d.fy = e.y; }
    function dragend(e, d) { if (!e.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }

    return () => simulation.on('tick', null);
  }, [graphData]);

  // Zoom Controls
  const handleZoom = (factor) => {
    d3.select(svgRef.current).transition().call(d3.zoom().on('zoom', (e) => d3.select('g.main-group').attr('transform', e.transform)).scaleBy, factor);
  };
  const handleReset = () => {
    d3.select(svgRef.current).transition().call(d3.zoom().on('zoom', (e) => d3.select('g.main-group').attr('transform', e.transform)).transform, d3.zoomIdentity.translate(450, 250).scale(0.8));
  };

  const LegendItem = ({ color, label, icon: Icon }) => (
    <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
      {Icon ? <Icon className="w-3 h-3" style={{ color }} /> : <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />}
      <span>{label}</span>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full relative group">
      {/* Header - now semi-transparent glass to show content behind if scrolled */}
      <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-white/80 backdrop-blur-sm z-10 absolute top-0 left-0 right-0">
        <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
          <GitBranch className="w-4 h-4 text-blue-600" /> Explanation Graph
        </h3>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
           <button onClick={() => handleZoom(1.2)} className="p-1 hover:bg-gray-100 rounded"><ZoomIn className="w-3.5 h-3.5 text-gray-600"/></button>
           <button onClick={() => handleZoom(0.8)} className="p-1 hover:bg-gray-100 rounded"><ZoomOut className="w-3.5 h-3.5 text-gray-600"/></button>
           <button onClick={handleReset} className="p-1 hover:bg-gray-100 rounded"><RefreshCw className="w-3.5 h-3.5 text-gray-600"/></button>
        </div>
      </div>

      <div className="relative flex-1 min-h-[500px]" ref={containerRef}>
        <svg ref={svgRef} className="w-full h-full bg-slate-50/50 cursor-grab active:cursor-grabbing"></svg>
        
        {/* Compact Legend - Bottom Right to avoid top header conflict */}
        <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md px-3 py-2 rounded-lg border border-gray-200 shadow-sm pointer-events-none select-none z-0">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <LegendItem color="#3b82f6" label="Clarity" />
            <LegendItem color="#ef4444" label="Accuracy" />
            <LegendItem icon={ArrowRight} color="#94a3b8" label="Flow" />
            <LegendItem icon={AlertTriangle} color="#ef4444" label="Conflict" />
          </div>
        </div>

        {/* Selected Node Panel */}
        {selectedNode && (
          <div className="absolute bottom-4 left-4 w-64 bg-white/95 backdrop-blur-md shadow-xl border border-gray-200 rounded-lg p-3 animate-in slide-in-from-bottom-2 z-20">
            <div className="flex justify-between items-start mb-1">
              <div className="flex items-center gap-2">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white uppercase`} style={{ backgroundColor: selectedNode.color }}>
                  {selectedNode.issueType}
                </span>
                <span className="font-bold text-gray-900 text-xs">Segment {selectedNode.id + 1}</span>
              </div>
              <button onClick={() => setSelectedNode(null)} className="text-gray-400 hover:text-gray-600"><XCircle className="w-4 h-4" /></button>
            </div>
            <p className="text-gray-600 text-xs line-clamp-3 mb-2 leading-relaxed">"{selectedNode.fullText}"</p>
            <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium border-t pt-2 border-gray-100">
              <span>Score: <span className="text-gray-900">{selectedNode.score.toFixed(1)}</span></span>
              {selectedNode.isDrift && <span className="text-yellow-600 flex items-center gap-1"><GitBranch className="w-3 h-3"/> Drift</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExplanationGraph;