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
  const simulationRef = useRef();
  const nodesRef = useRef([]); // Store node positions across re-renders
  
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

  // Process Data
  const graphData = useMemo(() => {
    if (!segments || segments.length === 0) return { nodes: [], links: [] };

    const drifts = coherenceData?.topic_drifts || [];
    const contradictions = coherenceData?.contradictions || [];
    const gaps = coherenceData?.logical_gaps || [];

    // 1. Create Nodes
    const newNodes = segments.map((seg, i) => {
      // Metric Analysis
      const metrics = {
        clarity: seg.clarity?.score || 10,
        structure: seg.structure?.score || 10,
        correctness: seg.correctness?.score || 10,
        pacing: seg.pacing?.score || 10,
        communication: seg.communication?.score || 10,
      };
      const entries = Object.entries(metrics).sort((a, b) => a[1] - b[1]);
      const lowest = entries[0];
      
      let issueColor = '#6b7280'; // gray default
      let issueLabel = lowest[0];
      
      if (lowest[1] >= 7.5) {
        issueColor = '#10b981'; // green
        issueLabel = 'Good';
      } else {
        const colorMap = {
          clarity: '#3b82f6', structure: '#8b5cf6', correctness: '#ef4444', 
          pacing: '#f59e0b', communication: '#ec4899'
        };
        issueColor = colorMap[lowest[0]] || '#6b7280';
      }

      const driftItem = drifts.find(d => d.segment_id === seg.segment_id);

      // Create new node object
      const newNode = {
        id: seg.segment_id,
        label: `S${seg.segment_id + 1}`,
        fullText: seg.text,
        score: seg.overall_segment_score,
        metrics: seg,
        radius: 20 + (seg.overall_segment_score * 1.5),
        color: issueColor,
        issueType: issueLabel,
        isDrift: !!driftItem,
        driftDegree: driftItem ? driftItem.drift_degree : 0,
      };

      // CRITICAL FIX: Preserve position from previous render
      // If we don't do this, D3 resets x/y to 0 every 3 seconds causing the "collapse"
      const existingNode = nodesRef.current.find(n => n.id === newNode.id);
      if (existingNode) {
        newNode.x = existingNode.x;
        newNode.y = existingNode.y;
        newNode.vx = existingNode.vx;
        newNode.vy = existingNode.vy;
      }

      return newNode;
    });

    // Update reference for next time
    nodesRef.current = newNodes;

    // 2. Create Links
    const links = [];
    for (let i = 0; i < newNodes.length - 1; i++) {
      const source = newNodes[i];
      const target = newNodes[i + 1];
      const gap = gaps.find(g => 
        (g.between_segment1 === source.id && g.between_segment2 === target.id) ||
        (g.between_segment1 === target.id && g.between_segment2 === source.id)
      );

      links.push({
        source: source.id,
        target: target.id,
        type: gap ? 'gap' : 'normal',
        id: `link-${source.id}-${target.id}`
      });
    }

    contradictions.forEach((c, idx) => {
      const s = newNodes.find(n => n.id === c.segment1_id);
      const t = newNodes.find(n => n.id === c.segment2_id);
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

    return { nodes: newNodes, links };
  }, [segments, coherenceData]);

  // D3 Rendering
  useEffect(() => {
    if (!graphData.nodes.length || !svgRef.current) return;

    const width = containerRef.current?.clientWidth || 900;
    const height = 500;
    const svg = d3.select(svgRef.current);
    
    // -- 1. SETUP LAYERS --
    // We strictly order groups to ensure z-index correctness (Links bottom, Nodes top)
    let linkGroup = svg.select('g.links');
    if (linkGroup.empty()) {
      const mainGroup = svg.append('g').attr('class', 'main-group');
      linkGroup = mainGroup.append('g').attr('class', 'links');
      mainGroup.append('g').attr('class', 'nodes'); // Placeholder for order

      // Zoom behavior
      const zoom = d3.zoom()
        .scaleExtent([0.1, 4])
        .on('zoom', (event) => mainGroup.attr('transform', event.transform));
      
      svg.call(zoom)
         .call(zoom.transform, d3.zoomIdentity.translate(width/2, height/2).scale(0.8));
         
      // Define Markers
      const defs = svg.append('defs');
      defs.append('marker')
        .attr('id', 'arrow-normal').attr('viewBox', '0 -5 10 10')
        .attr('refX', 34).attr('refY', 0)
        .attr('markerWidth', 6).attr('markerHeight', 6)
        .attr('orient', 'auto').append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', '#94a3b8');
      
      defs.append('marker')
        .attr('id', 'arrow-contradiction').attr('viewBox', '0 -5 10 10')
        .attr('refX', 30).attr('refY', 0)
        .attr('markerWidth', 8).attr('markerHeight', 8)
        .attr('orient', 'auto').append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', '#ef4444');
    }
    
    const nodeGroup = svg.select('g.main-group').select('g.nodes');

    // -- 2. SIMULATION --
    if (!simulationRef.current) {
      simulationRef.current = d3.forceSimulation()
        .force('link', d3.forceLink().id(d => d.id).distance(100))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('collide', d3.forceCollide().radius(d => d.radius + 10))
        .force('x', d3.forceX(d => (d.id * 100) - (graphData.nodes.length * 50)).strength(0.8)) // Stronger linear pull
        .force('y', d3.forceY(d => d.isDrift ? (d.driftDegree * 150 * (d.id % 2 ? 1 : -1)) : 0).strength(0.6));
    }

    const simulation = simulationRef.current;
    simulation.nodes(graphData.nodes);
    simulation.force('link').links(graphData.links);
    
    // Gentle reheat: keeps things moving if needed, but not exploding
    simulation.alphaTarget(0.01).restart();

    // -- 3. DRAW LINKS --
    const link = linkGroup.selectAll('path.link')
      .data(graphData.links, d => d.id)
      .join(
        enter => enter.append('path')
          .attr('class', 'link')
          .attr('fill', 'none')
          .attr('stroke-width', 0)
          .call(e => e.transition().duration(500).attr('stroke-width', d => d.type === 'contradiction' ? 2 : 3)),
        update => update,
        exit => exit.remove()
      )
      .attr('stroke', d => d.type === 'contradiction' ? '#ef4444' : '#cbd5e1')
      .attr('stroke-dasharray', d => d.type === 'gap' ? '5,5' : null)
      .attr('marker-end', d => d.type === 'contradiction' ? 'url(#arrow-contradiction)' : 'url(#arrow-normal)');

    // -- 4. DRAW NODES (Pure SVG, No ForeignObject) --
    const node = nodeGroup.selectAll('g.node')
      .data(graphData.nodes, d => d.id)
      .join(
        enter => {
          const g = enter.append('g').attr('class', 'node').attr('cursor', 'pointer');
          
          g.append('circle')
            .attr('r', 0)
            .attr('fill', '#fff')
            .call(e => e.transition().duration(500).attr('r', d => d.radius));
            
          // Add text label instead of HTML
          g.append('text')
            .attr('dy', '0.35em')
            .attr('text-anchor', 'middle')
            .attr('font-size', d => Math.max(10, d.radius * 0.4))
            .attr('font-weight', 'bold')
            .attr('fill', d => d.color)
            .style('pointer-events', 'none')
            .text(d => d.label);
            
          g.call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended));
            
          return g;
        },
        update => {
          update.select('circle')
            .transition().duration(300)
            .attr('r', d => d.radius)
            .attr('stroke', d => d.color)
            .attr('stroke-width', d => d.isDrift ? 2 : 4);
          
          update.select('text')
            .attr('font-size', d => Math.max(10, d.radius * 0.4))
            .attr('fill', d => d.color)
            .text(d => d.label);
            
          return update;
        },
        exit => exit.transition().duration(300).attr('opacity', 0).remove()
      );

    // Click handler
    node.on('click', (e, d) => {
      e.stopPropagation();
      setSelectedNode(d);
    });

    // Tick
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

    // Dragging
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

    return () => {
      simulation.on('tick', null);
    };
  }, [graphData]);

  // Zoom Helpers
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
        
        {/* Legend Overlay */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg border border-gray-200 shadow-sm text-sm space-y-3 pointer-events-none select-none z-10">
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
          <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur shadow-lg border border-gray-200 rounded-xl p-4 animate-in slide-in-from-bottom-2 z-20">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold text-white`} style={{ backgroundColor: selectedNode.color }}>
                    {selectedNode.issueType}
                  </span>
                  <span className="font-bold text-gray-900">Segment {selectedNode.id + 1}</span>
                  {selectedNode.isDrift && (
                     <span className="text-yellow-600 text-xs font-bold border border-yellow-200 px-1 rounded flex items-center gap-1">
                       <GitBranch className="w-3 h-3"/> DRIFT
                     </span>
                  )}
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