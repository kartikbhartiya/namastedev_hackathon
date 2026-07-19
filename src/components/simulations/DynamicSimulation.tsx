import { useState, useEffect, useRef, useCallback } from "react";
import type { DynamicSimConfig } from "@/lib/aiTutor";
import { DynamicSimRenderer } from "./DynamicSimRenderer";
import { SimulationControls, type ControlConfig } from "./SimulationControls";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";

interface DynamicSimulationProps {
    config: DynamicSimConfig;
}

function humanizeFormula(raw: string): string {
    return raw
        .replace(/Math\.sqrt\(([^)]+)\)/g, "√($1)")
        .replace(/Math\.pow\(([^,]+),\s*([^)]+)\)/g, "$1^$2")
        .replace(/Math\.abs\(([^)]+)\)/g, "|$1|")
        .replace(/Math\.sin\(/g, "sin(")
        .replace(/Math\.cos\(/g, "cos(")
        .replace(/Math\.tan\(/g, "tan(")
        .replace(/Math\.log\(/g, "ln(")
        .replace(/Math\.exp\(/g, "e^(")
        .replace(/Math\.PI/g, "π")
        .replace(/\*/g, "·")
        .replace(/springConstant/g, "k")
        .replace(/damping/g, "b")
        .replace(/amplitude/g, "A")
        .replace(/frequency/g, "f")
        .replace(/mass/g, "m")
        .replace(/velocity/g, "v")
        .replace(/acceleration/g, "a")
        .replace(/radius/g, "r")
        .replace(/charge/g, "q")
        .replace(/\btime\b/g, "t");
}

export function DynamicSimulation({ config }: DynamicSimulationProps) {
    const [paramValues, setParamValues] = useState<Record<string, number>>(() => {
        const vals: Record<string, number> = {};
        for (const p of config.parameters) {
            vals[p.key] = p.default;
        }
        return vals;
    });

    const [animating, setAnimating] = useState(false);
    const animRef = useRef<number | null>(null);
    const startTimeRef = useRef(0);

    useEffect(() => {
        const vals: Record<string, number> = {};
        for (const p of config.parameters) {
            vals[p.key] = p.default;
        }
        setParamValues(vals);
        setAnimating(false);
    }, [config]);

    useEffect(() => {
        if (!animating || !config.animation) return;

        const anim = config.animation;
        startTimeRef.current = performance.now();

        const tick = (now: number) => {
            const elapsed = (now - startTimeRef.current) / 1000;
            const duration = anim.duration || 2;
            let progress = (elapsed % duration) / duration;

            if (!anim.loop && elapsed >= duration) {
                progress = 1;
                setAnimating(false);
            }

            const value = anim.from + progress * (anim.to - anim.from);
            setParamValues((prev) => ({ ...prev, [anim.property]: value }));

            if (animating) {
                animRef.current = requestAnimationFrame(tick);
            }
        };

        animRef.current = requestAnimationFrame(tick);

        return () => {
            if (animRef.current) cancelAnimationFrame(animRef.current);
        };
    }, [animating, config.animation]);

    const handleChange = useCallback((key: string, value: any) => {
        setAnimating(false);
        setParamValues((prev) => ({ ...prev, [key]: value }));
    }, []);

    const handleReset = useCallback(() => {
        setAnimating(false);
        const vals: Record<string, number> = {};
        for (const p of config.parameters) {
            vals[p.key] = p.default;
        }
        setParamValues(vals);
    }, [config.parameters]);

    const controls: ControlConfig[] = config.parameters.map((p) => ({
        type: "slider" as const,
        label: p.label,
        key: p.key,
        min: p.min,
        max: p.max,
        step: p.step,
        value: paramValues[p.key] ?? p.default,
        unit: p.unit,
    }));

    const equation = config.equations.length > 0
        ? {
            label: config.equations[0].label,
            formula: humanizeFormula(config.equations[0].formula),
            values: config.equations.slice(1).map((eq) => ({
                label: eq.label,
                value: humanizeFormula(eq.formula),
            })),
        }
        : undefined;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-lg">{config.emoji}</span>
                    <div>
                        <h3 className="text-sm font-semibold text-foreground">{config.title}</h3>
                        <p className="text-[10px] text-muted-foreground">{config.description}</p>
                    </div>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-foreground/[0.04] text-neutral-300 border border-border">
                    AI Generated
                </span>
            </div>

            <DynamicSimRenderer config={config} paramValues={paramValues} />

            {equation && (
                <div className="p-3 bg-foreground/[0.02] rounded-lg border border-border">
                    <p className="text-[10px] text-muted-foreground font-medium mb-1">{equation.label}</p>
                    <p className="text-sm text-foreground font-mono">{equation.formula}</p>
                    {equation.values?.map((v, i) => (
                        <p key={i} className="text-[10px] text-muted-foreground mt-1 font-mono">{v.label}: {v.value}</p>
                    ))}
                </div>
            )}

            {config.animation && (
                <div className="flex gap-2">
                    <Button
                        onClick={() => setAnimating(!animating)}
                        className="flex-1 bg-foreground text-background hover:bg-neutral-200 text-xs h-8"
                    >
                        {animating ? (
                            <><Pause className="w-3.5 h-3.5 mr-1.5" /> Pause</>
                        ) : (
                            <><Play className="w-3.5 h-3.5 mr-1.5" /> Animate</>
                        )}
                    </Button>
                    <Button onClick={handleReset} variant="ghost" className="text-xs text-foreground/40 hover:text-foreground h-8">
                        <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reset
                    </Button>
                </div>
            )}

            {controls.length > 0 && (
                <SimulationControls
                    controls={controls}
                    onChange={handleChange}
                    onReset={handleReset}
                />
            )}
        </div>
    );
}
