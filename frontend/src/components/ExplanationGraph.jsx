import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const ExplanationGraph = ({ segments }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!segments || segments.length === 0) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    const width = 900;
    const height = 400;
    const nodeRadius = 30;
    const padding = 100;

    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Create nodes from segments
    const nodes = segments.map((seg, i) => ({
      id: seg.segment_id,
      label: `S${seg.segment_id + 1}`,
      score: seg.clarity.score,
      text: seg.text,
      x: padding + (i * (width - 2 * padding)) / Math.max(segments.length - 1, 1),
      y: height / 2,
    }));

    // Create links
    const links = segments.slice(0, -1).map((seg, i) => ({
      source: nodes[i],
      target: nodes[i + 1],
    }));

    // Color scale
    const getColor = (score) => {
      if (score >= 8) return '#10b981'; // green
      if (score >= 5) return '#f59e0b'; // yellow
      return '#ef4444'; // red
    };

    // Draw links
    svg
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('x1', (d) => d.source.x)
      .attr('y1', (d) => d.source.y)
      .attr('x2', (d) => d.target.x)
      .attr('y2', (d) => d.target.y)
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrowhead)');

    // Arrow marker
    svg
      .append('defs')
      .append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#cbd5e1');

    // Draw nodes
    const nodeGroups = svg
      .selectAll('g.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d) => `translate(${d.x}, ${d.y})`);

    // Node circles
    nodeGroups
      .append('circle')
      .attr('r', nodeRadius)
      .attr('fill', (d) => getColor(d.score))
      .attr('stroke', '#fff')
      .attr('stroke-width', 3)
      .style('cursor', 'pointer');

    // Node labels
    nodeGroups
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', '#fff')
      .attr('font-weight', 'bold')
      .attr('font-size', '14px')
      .text((d) => d.label);

    // Score labels below nodes
    nodeGroups
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', nodeRadius + 20)
      .attr('fill', '#374151')
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .text((d) => d.score.toFixed(1));

    // Tooltip
    const tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('background', 'rgba(0, 0, 0, 0.8)')
      .style('color', '#fff')
      .style('padding', '8px 12px')
      .style('border-radius', '6px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('max-width', '300px')
      .style('z-index', '1000');

    nodeGroups
      .on('mouseover', function (event, d) {
        tooltip.transition().duration(200).style('opacity', 1);
        tooltip
          .html(
            `<strong>Segment ${d.id + 1}</strong><br/><br/>${d.text.substring(
              0,
              100
            )}...`
          )
          .style('left', event.pageX + 10 + 'px')
          .style('top', event.pageY - 10 + 'px');
      })
      .on('mouseout', function () {
        tooltip.transition().duration(200).style('opacity', 0);
      });

    // Cleanup
    return () => {
      tooltip.remove();
    };
  }, [segments]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Explanation Flow Visualization
        </h3>
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
            <span className="text-gray-600">High (8-10)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-yellow-500 mr-2"></div>
            <span className="text-gray-600">Medium (5-7)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
            <span className="text-gray-600">Low (1-4)</span>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <svg ref={svgRef}></svg>
      </div>
    </div>
  );
};

export default ExplanationGraph;