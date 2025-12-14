// parthg2209/mindtrace/MindTrace-454002ad537de541ce806a44cdbebf379fec4615/frontend/src/components/ExplanationGraph.jsx

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  Play, Square, ArrowRight, GitBranch, AlertCircle, 
  HelpCircle, CheckCircle2, AlertTriangle, XCircle 
} from 'lucide-react';
import apiClient from '../api/client';

const ExplanationGraph = ({ segments, sessionId, coherenceData: initialCoherenceData }) => {
  const svgRef = useRef();
  const containerRef = useRef();
  const [coherenceData, setCoherenceData] = useState(initialCoherenceData);
  const [loading, setLoading] = useState(!initialCoherenceData && !!sessionId);
  const [selectedNode, setSelectedNode] = useState(null);

  // Fetch coherence data if not provided but session ID is available
  useEffect(() => {
    const fetchCoherence = async () => {
      if (!sessionId || initialCoherenceData) return;
      
      try {
        setLoading(true);
        const res = await apiClient.get(`/api/coherence/${sessionId}`);
        setCoherenceData(res.data);
      } catch (error) {
        console.error("Failed to fetch coherence data for graph", error);
        // Degrade gracefully with empty coherence
        setCoherenceData({ contradictions: [], topic_drifts: [], logical_gaps: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchCoherence();
  }, [sessionId, initialCoherenceData]);

  // Update internal state if prop changes
  useEffect(() => {
    if (initialCoherenceData) setCoherenceData(initialCoherenceData);
  }, [initialCoherenceData]);

  // Process Data for Graph
  const graphData = useMemo(() => {
    if (!segments || segments.length === 0) return { nodes: [], links: [] };

    const drifts = coherenceData?.topic_drifts || [];
    const contradictions = coherenceData?.contradictions || [];
    const gaps = coherenceData?.logical_gaps || [];

    // Helper: Identify Dominant Issue & Color
    const getIssueDetails = (seg) => {
      const metrics = {
        clarity: seg.clarity?.score || 10,
        structure: seg.structure?.score || 10,
        correctness: seg.correctness?.score || 10,
        pacing: seg.pacing?.score || 10,
        communication: seg.communication?.score || 10,
      };
      
      const entries = Object.entries(metrics);
      entries.sort((a, b) => a[1] - b[1]); // Sort by score ascending
      const lowest = entries[0];

      if (lowest[1] >= 7.5) return { type: 'good', color: '#10b981', label: 'Good' }; // Green
      
      const colorMap = {
        clarity: '#3b82f6',     // Blue
        structure: '#8b5cf6',   // Purple
        correctness: '#ef4444', // Red
        pacing: '#f59e0b',      // Orange
        communication: '#ec4899' // Pink
      };

      return { type: lowest[0], color: colorMap[lowest[0]] || '#6b7280', label: lowest[0] };
    };

    // Helper: Determine Role
    const getRole = (index, total, seg) => {
      if (index === 0) return 'Introduce';
      if (index === total - 1) return 'Conclude';
      if (seg.overall_segment_score < 4) return 'Anomaly';
      // Simple heuristic for transition: short text starting with transition words?
      // For now, default to Elaborate
      return 'Elaborate'; 
    };

    // 1. Create Nodes
    const nodes = segments.map((seg, i) => {
      const issue = getIssueDetails(seg);
      const role = getRole(i, segments.length, seg);
      const driftItem = drifts.find(d => d.segment_id === seg.segment_id);
      
      return {
        id: seg.segment_id,
        label: `S${seg.segment_id + 1}`,
        fullText: seg.text,
        score: seg.overall_segment_score,
        metrics: seg,
        
        // Visual Properties
        radius: 20 + (seg.overall_segment_score * 1.5), // Size = Score
        color: issue.color,
        issueType: issue.type,
        role: role,
        
        // Branching / Backbone Logic
        isDrift: !!driftItem,
        driftDegree: driftItem ? driftItem.drift_degree : 0,
        
        // Initial Position (Linear)
        x: i * 120,
        y: 0
      };
    });

    // 2. Create Links
    const links = [];

    // Sequential Links (The Flow)
    for (let i = 0; i < nodes.length - 1; i++) {
      const source = nodes[i];
      const target = nodes[i + 1];
      
      const gap = gaps.find(g => 
        (g.between_segment1 === source.id && g.between_segment2 === target.id) ||
        (g.between_segment1 === target.id && g.between_segment2 === source.id) // handle mixed order
      );

      links.push({
        source: source.id,
        target: target.id,
        type: gap ? 'gap' : 'normal', // Weak transition if gap
        gapSeverity: gap?.severity
      });
    }

    // Contradiction Links (Conflict Arcs)
    contradictions.forEach(c => {
      // Find indices to ensure we link existing nodes
      const s = nodes.find(n => n.id === c.segment1_id);
      const t = nodes.find(n => n.id === c.segment2_id);
      if (s && t) {
        links.push({
          source: s.id,
          target: t.id,
          type: 'contradiction',
          severity: c.severity,
          curvature: 0.5 // For arcing
        });
      }
    });

    return { nodes, links };
  }, [segments, coherenceData]);

  // D3 Rendering
  useEffect(() => {
    if (!graphData.nodes.length || !svgRef.current) return;

    const width = containerRef.current?.clientWidth || 900;
    const height = 500;

    // Clear previous
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])
      .style('max-width', '100%')
      .style('height', 'auto');

    // Arrowheads
    const defs = svg.append('defs');
    
    // Normal Arrow
    defs.append('marker')
      .attr('id', 'arrow-normal')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 28) // Offset for node radius
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#94a3b8');

    // Contradiction Arrow
    defs.append('marker')
      .attr('id', 'arrow-contradiction')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#ef4444');

    // Simulation
    const simulation = d3.forceSimulation(graphData.nodes)
      .force('link', d3.forceLink(graphData.links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('collide', d3.forceCollide().radius(d => d.radius + 10))
      .force('x', d3.forceX(d => {
        // Backbone alignment based on index
        return (d.id * 120) - (graphData.nodes.length * 60) + (width / 2);
      }).strength(0.8)) 
      .force('y', d3.forceY(d => {
        // Branching logic: Drifts pulled away from center
        if (d.isDrift) {
          return d.driftDegree * 200 * (d.id % 2 === 0 ? 1 : -1); // Alternating up/down
        }
        return height / 2;
      }).strength(d => d.isDrift ? 0.5 : 1)); // Strong pull for backbone, weaker for drift

    // Draw Links
    const linkGroup = svg.append('g').selectAll('path')
      .data(graphData.links)
      .join('path')
      .attr('stroke', d => {
        if (d.type === 'contradiction') return '#ef4444';
        return '#cbd5e1';
      })
      .attr('stroke-width', d => d.type === 'contradiction' ? 2 : 3)
      .attr('stroke-dasharray', d => d.type === 'gap' ? '5,5' : null)
      .attr('fill', 'none')
      .attr('marker-end', d => d.type === 'contradiction' ? 'url(#arrow-contradiction)' : 'url(#arrow-normal)');

    // Draw Nodes
    const nodeGroup = svg.append('g').selectAll('g')
      .data(graphData.nodes)
      .join('g')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    // Node Circles (Backbone/Branch)
    nodeGroup.append('circle')
      .attr('r', d => d.radius)
      .attr('fill', '#fff')
      .attr('stroke', d => d.color)
      .attr('stroke-width', d => d.isDrift ? 2 : 4) // Thicker for backbone
      .style('cursor', 'pointer');
      
    // Role Icons/Labels inside Nodes
    nodeGroup.append('foreignObject')
      .attr('x', d => -d.radius)
      .attr('y', d => -d.radius)
      .attr('width', d => d.radius * 2)
      .attr('height', d => d.radius * 2)
      .style('pointer-events', 'none')
      .append('xhtml:div')
      .style('width', '100%')
      .style('height', '100%')
      .style('display', 'flex')
      .style('align-items', 'center')
      .style('justify-content', 'center')
      .style('color', d => d.color)
      .html(d => {
        // Icon mapping based on Role
        let iconHtml = '';
        const size = d.radius; 
        if (d.role === 'Introduce') iconHtml = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
        else if (d.role === 'Conclude') iconHtml = `<svg width="${size*0.8}" height="${size*0.8}" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>`;
        else if (d.role === 'Anomaly') iconHtml = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
        else iconHtml = `<span style="font-weight:800; font-size:${size*0.6}px">${d.label}</span>`;
        return iconHtml;
      });

    // Interaction
    nodeGroup.on('click', (e, d) => {
      setSelectedNode(d);
    });

    // Update positions
    simulation.on('tick', () => {
      linkGroup.attr('d', d => {
        if (d.type === 'contradiction') {
          // Arc path for contradictions
          const dx = d.target.x - d.source.x;
          const dy = d.target.y - d.source.y;
          const dr = Math.sqrt(dx * dx + dy * dy);
          return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
        }
        return `M${d.source.x},${d.source.y}L${d.target.x},${d.target.y}`;
      });

      nodeGroup.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Drag functions
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

    return () => simulation.stop();
  }, [graphData]);

  // Legend Component
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
            Visual analysis of teaching logic, drifts, and coherence.
          </p>
        </div>
        {loading && <div className="text-xs text-blue-500 animate-pulse">Analyzing structure...</div>}
      </div>

      <div className="relative flex-1 min-h-[500px]" ref={containerRef}>
        <svg ref={svgRef} className="w-full h-full bg-slate-50/30"></svg>
        
        {/* Graph Controls / Legend Overlay */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg border border-gray-200 shadow-sm text-sm space-y-3">
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
              <LegendItem icon={AlertTriangle} color="#ef4444" label="Contradiction (Red Arc)" />
            </div>
          </div>
        </div>

        {/* Selected Node Inspector */}
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
                  {selectedNode.isDrift && (
                    <div className="flex items-center gap-1 text-yellow-600">
                      <GitBranch className="w-3 h-3" />
                      <span>Topic Drift ({(selectedNode.driftDegree * 100).toFixed(0)}%)</span>
                    </div>
                  )}
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