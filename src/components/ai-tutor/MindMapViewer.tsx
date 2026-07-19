"use client";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import type { MindMapNode } from "@/lib/aiTutor";

const DEPTH_COLORS = [
    "#a855f7", "#ec4899", "#3b82f6", "#f59e0b",
    "#10b981", "#f43f5e", "#6366f1", "#14b8a6",
];

// Layout configuration
const LEVEL_GAP = 220; // horizontal gap
const NODE_HEIGHT = 80; // vertical gap

interface PositionedNode {
    id: string;
    label: string;
    description: string;
    depth: number;
    x: number;
    y: number;
    parentId: string | null;
}

// Flat-mapping layout helper
function computeLayout(
    node: MindMapNode,
    parentId: string | null = null,
    depth = 0,
    state = { currentY: 30 }
): PositionedNode[] {
    if (!node) return [];

    const nodes: PositionedNode[] = [];
    const children = Array.isArray(node.children) ? node.children : [];

    // Pre-calculate children offsets
    const childNodes: PositionedNode[] = [];
    for (const child of children) {
        if (!child) continue;
        childNodes.push(...computeLayout(child, node.id, depth + 1, state));
    }

    // Midpoint Y positioning for parents based on children
    let y = 0;
    if (childNodes.length === 0) {
        y = state.currentY;
        state.currentY += NODE_HEIGHT;
    } else {
        const directChildren = childNodes.filter(c => c.parentId === node.id);
        const minY = directChildren[0]?.y ?? 0;
        const maxY = directChildren[directChildren.length - 1]?.y ?? 0;
        y = (minY + maxY) / 2;
    }

    const current: PositionedNode = {
        id: node.id || `n-${Math.random().toString(36).substring(2, 9)}`,
        label: node.label || "Concept",
        description: node.description || "",
        depth,
        x: depth * LEVEL_GAP + 40,
        y,
        parentId
    };

    return [current, ...childNodes];
}

interface MindMapViewerProps {
    data: MindMapNode | null;
    loading?: boolean;
}

export function MindMapViewer({ data, loading }: MindMapViewerProps) {
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    const layout = useMemo(() => {
        if (!data) return [];
        return computeLayout(data);
    }, [data]);

    // Calculate canvas size bounds
    const { width, height } = useMemo(() => {
        if (layout.length === 0) return { width: 700, height: 400 };
        const maxX = Math.max(...layout.map(n => n.x)) + 200;
        const maxY = Math.max(...layout.map(n => n.y)) + 80;
        return {
            width: Math.max(700, maxX),
            height: Math.max(380, maxY)
        };
    }, [layout]);

    if (loading) {
        return (
            <div className="w-full h-[380px] bg-foreground/[0.01] rounded-xl border border-border flex items-center justify-center">
                <div className="text-center space-y-3">
                    <div className="w-8 h-8 border-2 border-neutral-700 border-t-neutral-300 rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-muted-foreground">Mapping concept vectors...</p>
                </div>
            </div>
        );
    }

    if (!data || layout.length === 0) {
        return (
            <div className="w-full h-[380px] bg-foreground/[0.01] rounded-xl border border-border flex items-center justify-center">
                <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">No active mind map visualization</p>
                    <p className="text-[10px] text-muted-foreground/60">Ask Aria to "create a mind map for gravity" to plot one</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full bg-black/40 rounded-xl border border-border overflow-x-auto overflow-y-auto scrollbar-thin relative p-4 h-[380px]">
            <div style={{ width: `${width}px`, height: `${height}px`, position: "relative" }}>
                {/* SVG Connections Canvas */}
                <svg
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: `${width}px`,
                        height: `${height}px`,
                        pointerEvents: "none"
                    }}
                >
                    {/* Background grid */}
                    <defs>
                        <pattern id="mapGrid" width={30} height={30} patternUnits="userSpaceOnUse">
                            <circle cx={1.5} cy={1.5} r={1.5} fill="#ffffff04" />
                        </pattern>
                    </defs>
                    <rect width={width} height={height} fill="url(#mapGrid)" />

                    {layout.map(node => {
                        if (!node.parentId) return null;
                        const parent = layout.find(n => n.id === node.parentId);
                        if (!parent) return null;

                        // Draw smoothstep connection curve
                        const startX = parent.x + 130;
                        const startY = parent.y + 18;
                        const endX = node.x;
                        const endY = node.y + 18;
                        const midX = (startX + endX) / 2;

                        const path = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
                        const color = DEPTH_COLORS[node.depth % DEPTH_COLORS.length];

                        return (
                            <path
                                key={`${parent.id}-${node.id}`}
                                d={path}
                                fill="none"
                                stroke={color}
                                strokeWidth={2}
                                opacity={0.3}
                            />
                        );
                    })}
                </svg>

                {/* HTML Nodes overlay */}
                {layout.map(node => {
                    const color = DEPTH_COLORS[node.depth % DEPTH_COLORS.length];
                    const isSelected = selectedNodeId === node.id;
                    return (
                        <div
                            key={node.id}
                            style={{
                                position: "absolute",
                                left: `${node.x}px`,
                                top: `${node.y}px`,
                                width: "140px",
                                height: "36px",
                            }}
                            className="group"
                        >
                            <button
                                onClick={() => setSelectedNodeId(isSelected ? null : node.id)}
                                style={{
                                    borderColor: color + "40",
                                    backgroundColor: color + (isSelected ? "25" : "08"),
                                    boxShadow: isSelected ? `0 0 15px ${color}30` : `0 4px 12px rgba(0,0,0,0.3)`
                                }}
                                className={cn(
                                    "w-full h-full rounded-xl border px-3 py-1.5 flex items-center justify-between text-left transition-all",
                                    "hover:scale-105 active:scale-95"
                                )}
                            >
                                <span className="text-xs font-semibold text-foreground truncate">{node.label}</span>
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                            </button>

                            {/* Popup Tooltip */}
                            {isSelected && node.description && (
                                <div
                                    style={{
                                        position: "absolute",
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                        bottom: "125%",
                                        zIndex: 50,
                                        width: "280px"
                                    }}
                                    className="p-3 bg-neutral-900 border border-border rounded-xl shadow-2xl animate-in fade-in duration-200"
                                >
                                    <div className="flex items-center gap-1.5 mb-1.5 border-b border-border pb-1">
                                        <div className="w-1 h-3 rounded-full" style={{ backgroundColor: color }} />
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">{node.label}</span>
                                    </div>
                                    <p className="text-xs text-foreground/80 leading-relaxed font-sans">{node.description}</p>
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-neutral-900 border-b border-r border-border rotate-45" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
