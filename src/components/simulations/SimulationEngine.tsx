import React, { useState, lazy, Suspense } from "react";
import { cn } from "@/lib/utils";
import { SIMULATION_REGISTRY, getSimulationsByDomain, type SimulationEntry, type SimulationDomain } from "./SimulationRegistry";
import { Info, Atom, Calculator, Code2, Lightbulb } from "lucide-react";
import type { DynamicSimConfig } from "@/lib/aiTutor";
import { DynamicSimulation } from "./DynamicSimulation";

const GaussLawSim = lazy(() => import("./scenes/GaussLawSim").then(m => ({ default: m.GaussLawSim })));
const WaveInterferenceSim = lazy(() => import("./scenes/WaveInterferenceSim").then(m => ({ default: m.WaveInterferenceSim })));
const ProjectileMotionSim = lazy(() => import("./scenes/ProjectileMotionSim").then(m => ({ default: m.ProjectileMotionSim })));
const SortingAlgoSim = lazy(() => import("./scenes/SortingAlgoSim").then(m => ({ default: m.SortingAlgoSim })));
const GraphPlotterSim = lazy(() => import("./scenes/GraphPlotterSim").then(m => ({ default: m.GraphPlotterSim })));
const PendulumSim = lazy(() => import("./scenes/PendulumSim").then(m => ({ default: m.PendulumSim })));

const SIM_COMPONENTS: Record<string, React.LazyExoticComponent<() => React.JSX.Element>> = {
    gauss_law: GaussLawSim,
    wave_interference: WaveInterferenceSim,
    projectile_motion: ProjectileMotionSim,
    sorting_algorithms: SortingAlgoSim,
    graph_plotter: GraphPlotterSim,
    pendulum: PendulumSim,
};

const DOMAIN_ICONS: Record<SimulationDomain, React.ReactNode> = {
    physics: <Atom className="w-3.5 h-3.5" />,
    math: <Calculator className="w-3.5 h-3.5" />,
    algorithms: <Code2 className="w-3.5 h-3.5" />,
    conceptual: <Lightbulb className="w-3.5 h-3.5" />,
};

const DOMAIN_LABELS: Record<SimulationDomain, string> = {
    physics: "Physics",
    math: "Mathematics",
    algorithms: "Algorithms",
    conceptual: "Conceptual",
};

interface SimulationEngineProps {
    activeSimId?: string | null;
    dynamicConfig?: DynamicSimConfig | null;
    onClearDynamic?: () => void;
    onClearActiveSimId?: () => void;
}

function SimulationLoader() {
    return (
        <div className="w-full aspect-[4/3] bg-black/40 rounded-xl border border-border flex items-center justify-center">
            <div className="text-center space-y-3">
                <div className="w-10 h-10 border-3 border-neutral-500/30 border-t-neutral-500 rounded-full animate-spin mx-auto" />
                <p className="text-xs text-muted-foreground">Loading simulation...</p>
            </div>
        </div>
    );
}

export function SimulationEngine({ activeSimId, dynamicConfig, onClearDynamic, onClearActiveSimId }: SimulationEngineProps) {
    const [pickerSim, setPickerSim] = useState<string>("");
    const groupedSims = getSimulationsByDomain();

    const effectiveSimId = activeSimId || pickerSim;
    const SimComponent = effectiveSimId ? SIM_COMPONENTS[effectiveSimId] : null;

    const handleBack = () => {
        setPickerSim("");
        onClearActiveSimId?.();
        onClearDynamic?.();
    };

    if (dynamicConfig) {
        return (
            <div className="space-y-4">
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div />
                        <button
                            onClick={handleBack}
                            className="text-xs text-neutral-400 hover:text-neutral-300 px-2 py-1 rounded-lg hover:bg-neutral-500/10 transition-colors"
                        >
                            ← All Sims
                        </button>
                    </div>
                    <DynamicSimulation config={dynamicConfig} />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {SimComponent ? (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">{SIMULATION_REGISTRY.find(s => s.id === effectiveSimId)?.emoji}</span>
                            <div>
                                <h3 className="text-sm font-semibold text-foreground">
                                    {SIMULATION_REGISTRY.find(s => s.id === effectiveSimId)?.title}
                                </h3>
                                <p className="text-[10px] text-muted-foreground">
                                    {SIMULATION_REGISTRY.find(s => s.id === effectiveSimId)?.description}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleBack}
                            className="text-xs text-neutral-400 hover:text-neutral-300 px-2 py-1 rounded-lg hover:bg-neutral-500/10 transition-colors"
                        >
                            ← All Sims
                        </button>
                    </div>

                    <Suspense fallback={<SimulationLoader />}>
                        <SimComponent />
                    </Suspense>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="text-center space-y-1">
                        <h3 className="text-lg font-bold text-foreground">Interactive Simulations</h3>
                        <p className="text-xs text-muted-foreground">Choose a simulation to explore or ask your tutor to visualize a concept</p>
                    </div>

                    {(Object.keys(groupedSims) as SimulationDomain[]).map((domain) => {
                        const sims = groupedSims[domain];
                        if (sims.length === 0) return null;
                        return (
                            <div key={domain} className="space-y-2">
                                <h4 className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                    {DOMAIN_ICONS[domain]} {DOMAIN_LABELS[domain]}
                                </h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {sims.map((sim) => (
                                        <button
                                            key={sim.id}
                                            onClick={() => setPickerSim(sim.id)}
                                            className="p-3 rounded-xl bg-foreground/[0.03] border border-border hover:bg-foreground/[0.06] hover:border-neutral-500/30 transition-all text-left group"
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-lg">{sim.emoji}</span>
                                                <span className="text-xs font-semibold text-foreground group-hover:text-neutral-300 transition-colors">{sim.title}</span>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground leading-relaxed">{sim.description}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    <div className="flex items-start gap-2 p-3 bg-foreground/[0.02] border border-border rounded-lg">
                        <Info className="w-4 h-4 text-neutral-400 flex-shrink-0 mt-0.5" />
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Tip: In Chat mode, ask your tutor to "visualize projectile motion" or "show me wave interference" — it will auto-open the right simulation!
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
