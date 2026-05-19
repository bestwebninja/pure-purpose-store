import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  forceCenter,
  forceLink,
  forceManyBody,
  forceSimulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";

export type GraphNode = SimulationNodeDatum & {
  id: string;
  kind: "request" | "intent";
  label: string;
  data: Record<string, unknown>;
};

export type GraphEdge = SimulationLinkDatum<GraphNode> & {
  id: string;
  status: "confirmed" | "pending" | "approved" | "executed" | string;
  score: number;
  data: Record<string, unknown>;
};

type Props = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeSelect?: (node: GraphNode) => void;
  onEdgeSelect?: (edge: GraphEdge) => void;
  width?: number;
  height?: number;
};

export function PetriGraphView({ nodes, edges, onNodeSelect, onEdgeSelect, width, height }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: width ?? 900, h: height ?? 600 });
  useLayoutEffect(() => {
    if (width && height) return;
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const w = Math.max(280, Math.floor(rect.width));
      // Responsive aspect: taller on narrow viewports, wider on desktop.
      const h = w < 640 ? Math.round(w * 1.1) : w < 1024 ? Math.round(w * 0.75) : Math.round(w * 0.6);
      setSize({ w, h: Math.min(720, Math.max(360, h)) });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width, height]);
  const W = width ?? size.w;
  const H = height ?? size.h;
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [, force] = useState(0);
  const [view, setView] = useState({ k: 1, x: 0, y: 0 });
  const [hover, setHover] = useState<{ x: number; y: number; text: string } | null>(null);

  // Stable mutable copies so d3-force can mutate x/y without React re-renders churning.
  const simNodes = useMemo<GraphNode[]>(
    () => nodes.map((n) => ({ ...n })),
    // re-run when set of ids changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nodes.map((n) => n.id).join("|")],
  );
  const simEdges = useMemo<GraphEdge[]>(
    () => edges.map((e) => ({ ...e })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [edges.map((e) => e.id).join("|")],
  );

  useEffect(() => {
    if (!simNodes.length) return;
    const sim = forceSimulation<GraphNode>(simNodes)
      .force(
        "link",
        forceLink<GraphNode, GraphEdge>(simEdges)
          .id((d) => d.id)
          .distance(120)
          .strength(0.4),
      )
      .force("charge", forceManyBody().strength(-180))
      .force("center", forceCenter(W / 2, H / 2))
      .on("tick", () => force((x) => x + 1));
    return () => { sim.stop(); };
  }, [simNodes, simEdges, W, H]);

  // Pan + zoom (very light)
  const dragRef = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setView((v) => ({ ...v, k: Math.max(0.3, Math.min(3, v.k * (e.deltaY < 0 ? 1.1 : 0.9))) }));
  };
  const onMouseDown = (e: React.MouseEvent) => {
    dragRef.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    setView((v) => ({ ...v, x: dragRef.current!.vx + dx, y: dragRef.current!.vy + dy }));
  };
  const onMouseUp = () => { dragRef.current = null; };

  return (
    <div ref={containerRef} className="relative w-full">
      <svg
        ref={svgRef}
        width={W}
        height={H}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        className="block w-full max-w-full rounded-lg border border-border bg-background touch-none"
        style={{ cursor: dragRef.current ? "grabbing" : "grab" }}
      >
        <g transform={`translate(${view.x},${view.y}) scale(${view.k})`}>
          {simEdges.map((e) => {
            const s = e.source as GraphNode;
            const t = e.target as GraphNode;
            if (typeof s !== "object" || typeof t !== "object") return null;
            const stroke = e.status === "confirmed" ? "#16a34a" : "#eab308";
            const w = Math.max(1, Math.min(8, e.score / 50));
            return (
              <line
                key={e.id}
                x1={s.x ?? 0} y1={s.y ?? 0}
                x2={t.x ?? 0} y2={t.y ?? 0}
                stroke={stroke}
                strokeWidth={w}
                strokeOpacity={0.7}
                style={{ cursor: "pointer" }}
                onClick={() => onEdgeSelect?.(e)}
                onMouseEnter={(ev) =>
                  setHover({
                    x: ev.clientX,
                    y: ev.clientY,
                    text: `score ${e.score} Â· ${e.status}`,
                  })
                }
                onMouseLeave={() => setHover(null)}
              />
            );
          })}
          {simNodes.map((n) => {
            const fill = n.kind === "request" ? "#2563eb" : "#f5c518";
            return (
              <g
                key={n.id}
                transform={`translate(${n.x ?? 0},${n.y ?? 0})`}
                onClick={() => onNodeSelect?.(n)}
                style={{ cursor: "pointer" }}
              >
                <circle r={10} fill={fill} stroke="#0a1f6b" strokeWidth={1.5} />
                <text x={14} y={4} fontSize={11} fill="currentColor" className="text-foreground">
                  {n.label.slice(0, 24)}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
      {hover && (
        <div
          className="pointer-events-none fixed z-50 rounded bg-foreground px-2 py-1 text-xs text-background shadow"
          style={{ left: hover.x + 12, top: hover.y + 12 }}
        >
          {hover.text}
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span><span className="inline-block h-3 w-3 rounded-full" style={{ background: "#2563eb" }} /> Help Request</span>
        <span><span className="inline-block h-3 w-3 rounded-full" style={{ background: "#f5c518" }} /> Sponsor Intent</span>
        <span><span className="inline-block h-1 w-6" style={{ background: "#16a34a" }} /> auto_match</span>
        <span><span className="inline-block h-1 w-6" style={{ background: "#eab308" }} /> pending_review</span>
        <span>Scroll to zoom Â· drag to pan</span>
      </div>
    </div>
  );
}

