import { useState, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SimulationControls, type ControlConfig } from "../SimulationControls";
import { Plus } from "lucide-react";

const PRESET_FUNCTIONS: { label: string; fn: string; color: string }[] = [
    { label: "sin(x)", fn: "Math.sin(x)", color: "#3b82f6" },
    { label: "cos(x)", fn: "Math.cos(x)", color: "#ef4444" },
    { label: "x²", fn: "x*x", color: "#10b981" },
    { label: "x³", fn: "x*x*x", color: "#f59e0b" },
    { label: "eˣ", fn: "Math.exp(x)", color: "#737373" },
    { label: "ln(x)", fn: "Math.log(x)", color: "#ec4899" },
    { label: "1/x", fn: "1/x", color: "#06b6d4" },
    { label: "tan(x)", fn: "Math.tan(x)", color: "#f97316" },
];

function evaluateFunction(fnStr: string, x: number): number {
    try {
        const fn = new Function("x", `return ${fnStr}`);
        const y = fn(x);
        if (!Number.isFinite(y)) return NaN;
        return y;
    } catch {
        return NaN;
    }
}

export function GraphPlotterSim() {
    const [activeFunctions, setActiveFunctions] = useState<{ fn: string; color: string; label: string }[]>([
        PRESET_FUNCTIONS[0],
    ]);
    const [xRange, setXRange] = useState(10);
    const [yRange, setYRange] = useState(5);
    const [customFn, setCustomFn] = useState("");

    const canvasWidth = 700;
    const canvasHeight = 300;
    const padding = 40;

    const allCurves = useMemo(() => {
        return activeFunctions.map(({ fn, color, label }) => {
            const points: { x: number; y: number }[] = [];
            const steps = canvasWidth - 2 * padding;
            for (let i = 0; i <= steps; i++) {
                const x = ((i / steps) * 2 - 1) * xRange;
                const y = evaluateFunction(fn, x);
                points.push({ x, y });
            }
            return { points, color, label };
        });
    }, [activeFunctions, xRange]);

    const toCanvasX = (x: number) => padding + ((x / xRange + 1) / 2) * (canvasWidth - 2 * padding);
    const toCanvasY = (y: number) => canvasHeight / 2 - (y / yRange) * (canvasHeight / 2 - padding);

    const addPreset = (preset: typeof PRESET_FUNCTIONS[0]) => {
        if (activeFunctions.some((f) => f.fn === preset.fn)) return;
        setActiveFunctions((prev) => [...prev, preset]);
    };

    const removeFunction = (idx: number) => {
        setActiveFunctions((prev) => prev.filter((_, i) => i !== idx));
    };

    const addCustom = () => {
        if (!customFn.trim()) return;
        const colors = ["#f59e0b", "#06b6d4", "#ec4899", "#10b981", "#737373"];
        setActiveFunctions((prev) => [
            ...prev,
            { fn: customFn, color: colors[prev.length % colors.length], label: customFn },
        ]);
        setCustomFn("");
    };

    return (
        <div className="space-y-3">
            <div className="relative w-full bg-black/40 rounded-xl border border-white/[0.06] overflow-hidden">
                <svg viewBox={`0 0 ${canvasWidth} ${canvasHeight}`} className="w-full" style={{ aspectRatio: `${canvasWidth}/${canvasHeight}` }}>
                    <defs>
                        <pattern id="plotGrid" width={20} height={20} patternUnits="userSpaceOnUse">
                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#ffffff03" strokeWidth={0.5} />
                        </pattern>
                    </defs>
                    <rect width={canvasWidth} height={canvasHeight} fill="url(#plotGrid)" />

                    {Array.from({ length: Math.floor(xRange * 2) + 1 }, (_, i) => {
                        const x = i - xRange;
                        const cx = toCanvasX(x);
                        return (
                            <g key={`v${i}`}>
                                <line x1={cx} y1={padding} x2={cx} y2={canvasHeight - padding} stroke="#ffffff08" strokeWidth={1} />
                                {x % 2 === 0 && (
                                    <text x={cx} y={canvasHeight - padding + 14} fill="#666" fontSize={8} textAnchor="middle">{x}</text>
                                )}
                            </g>
                        );
                    })}

                    {Array.from({ length: Math.floor(yRange * 2) + 1 }, (_, i) => {
                        const y = i - yRange;
                        const cy = toCanvasY(y);
                        return (
                            <g key={`h${i}`}>
                                <line x1={padding} y1={cy} x2={canvasWidth - padding} y2={cy} stroke="#ffffff08" strokeWidth={1} />
                                {y !== 0 && (
                                    <text x={padding - 8} y={cy + 3} fill="#666" fontSize={8} textAnchor="end">{y}</text>
                                )}
                            </g>
                        );
                    })}

                    <line x1={padding} y1={canvasHeight / 2} x2={canvasWidth - padding} y2={canvasHeight / 2} stroke="#ffffff20" strokeWidth={1.5} />
                    <line x1={canvasWidth / 2} y1={padding} x2={canvasWidth / 2} y2={canvasHeight - padding} stroke="#ffffff20" strokeWidth={1.5} />

                    {allCurves.map((curve, ci) => {
                        let pathD = "";
                        let prevValid = false;
                        curve.points.forEach((pt) => {
                            const cx = toCanvasX(pt.x);
                            const cy = toCanvasY(pt.y);
                            if (isNaN(pt.y) || Math.abs(pt.y) > yRange * 2) {
                                prevValid = false;
                                return;
                            }
                            if (!prevValid) {
                                pathD += `M ${cx} ${cy} `;
                                prevValid = true;
                            } else {
                                pathD += `L ${cx} ${cy} `;
                            }
                        });
                        return (
                            <path key={ci} d={pathD} fill="none" stroke={curve.color} strokeWidth={2} opacity={0.85} />
                        );
                    })}
                </svg>
            </div>

            <div className="space-y-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Quick Functions</p>
                <div className="flex flex-wrap gap-1.5">
                    {PRESET_FUNCTIONS.map((p) => {
                        const active = activeFunctions.some((f) => f.fn === p.fn);
                        return (
                            <button
                                key={p.fn}
                                onClick={() => active ? removeFunction(activeFunctions.findIndex((f) => f.fn === p.fn)) : addPreset(p)}
                                className={cn(
                                    "px-2.5 py-1 text-xs rounded-lg border transition-all",
                                    active
                                        ? "border-neutral-500/40 bg-neutral-500/15 text-white"
                                        : "border-white/10 bg-white/[0.03] text-white/50 hover:text-white/70"
                                )}
                                style={active ? { borderColor: p.color + "60" } : {}}
                            >
                                <span style={{ color: active ? p.color : undefined }}>{p.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex gap-2">
                <Input
                    value={customFn}
                    onChange={(e) => setCustomFn(e.target.value)}
                    placeholder="Custom: e.g. Math.sin(x)*x"
                    className="text-xs h-8 bg-white/[0.03] border-white/10 text-white placeholder:text-white/20"
                    onKeyDown={(e) => e.key === "Enter" && addCustom()}
                />
                <Button onClick={addCustom} size="sm" className="h-8 bg-white hover:bg-neutral-200 text-black text-xs px-3">
                    <Plus className="w-3 h-3 mr-1" /> Add
                </Button>
            </div>

            <div className="flex flex-wrap gap-2">
                {activeFunctions.map((f, i) => (
                    <span key={i} className="flex items-center gap-1.5 text-[10px] text-white/70">
                        <span className="w-3 h-0.5 rounded inline-block" style={{ backgroundColor: f.color }} />
                        {f.label}
                        <button onClick={() => removeFunction(i)} className="text-white/30 hover:text-red-400 ml-0.5">×</button>
                    </span>
                ))}
            </div>

            <SimulationControls
                controls={[
                    { type: 'slider', label: 'X Range', key: 'xRange', min: 2, max: 20, step: 1, value: xRange },
                    { type: 'slider', label: 'Y Range', key: 'yRange', min: 1, max: 20, step: 1, value: yRange },
                ]}
                onChange={(key, val) => {
                    if (key === 'xRange') setXRange(val);
                    else if (key === 'yRange') setYRange(val);
                }}
                onReset={() => { setActiveFunctions([PRESET_FUNCTIONS[0]]); setXRange(10); setYRange(5); }}
            />
        </div>
    );
}
