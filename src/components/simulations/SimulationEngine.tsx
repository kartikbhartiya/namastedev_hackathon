"use client";

import React, { useState, lazy, Suspense } from "react";
import { cn } from "@/lib/utils";
import { SIMULATION_REGISTRY, getSimulationsByDomain, type SimulationEntry, type SimulationDomain } from "./SimulationRegistry";
import { Info, Atom, Calculator, Code2, Lightbulb, Server } from "lucide-react";
import type { DynamicSimConfig } from "@/lib/aiTutor";
import { DynamicSimulation } from "./DynamicSimulation";

const GaussLawSim = lazy(() => import("./scenes/GaussLawSim").then(m => ({ default: m.GaussLawSim })));
const WaveInterferenceSim = lazy(() => import("./scenes/WaveInterferenceSim").then(m => ({ default: m.WaveInterferenceSim })));
const ProjectileMotionSim = lazy(() => import("./scenes/ProjectileMotionSim").then(m => ({ default: m.ProjectileMotionSim })));
const SortingAlgoSim = lazy(() => import("./scenes/SortingAlgoSim").then(m => ({ default: m.SortingAlgoSim })));
const GraphPlotterSim = lazy(() => import("./scenes/GraphPlotterSim").then(m => ({ default: m.GraphPlotterSim })));
const PendulumSim = lazy(() => import("./scenes/PendulumSim").then(m => ({ default: m.PendulumSim })));
const BstSim = lazy(() => import("./scenes/BstSim").then(m => ({ default: m.BstSim })));
const CpuSchedulingSim = lazy(() => import("./scenes/CpuSchedulingSim").then(m => ({ default: m.CpuSchedulingSim })));
const StackQueueSim = lazy(() => import("./scenes/StackQueueSim").then(m => ({ default: m.StackQueueSim })));
const TcpHandshakeSim = lazy(() => import("./scenes/TcpHandshakeSim").then(m => ({ default: m.TcpHandshakeSim })));

const SIM_COMPONENTS: Record<string, React.LazyExoticComponent<() => React.JSX.Element>> = {
    gauss_law: GaussLawSim,
    wave_interference: WaveInterferenceSim,
    projectile_motion: ProjectileMotionSim,
    sorting_algorithms: SortingAlgoSim,
    graph_plotter: GraphPlotterSim,
    pendulum: PendulumSim,
    bst: BstSim,
    cpu_scheduling: CpuSchedulingSim,
    stack_queue: StackQueueSim,
    tcp_handshake: TcpHandshakeSim,
};

const DOMAIN_ICONS: Record<SimulationDomain, React.ReactNode> = {
    physics: <Atom className="w-3.5 h-3.5" />,
    math: <Calculator className="w-3.5 h-3.5" />,
    algorithms: <Code2 className="w-3.5 h-3.5" />,
    'cs-systems': <Server className="w-3.5 h-3.5" />,
    conceptual: <Lightbulb className="w-3.5 h-3.5" />,
};

const DOMAIN_LABELS: Record<SimulationDomain, string> = {
    physics: "Physics",
    math: "Mathematics",
    algorithms: "Data Structures & Algorithms",
    'cs-systems': "B.Tech Systems & Networks",
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
                            className="text-xs text-neutral-400 hover:text-neutral-300 px-2.5 py-1 rounded-lg bg-neutral-500/10 hover:bg-neutral-500/20 transition-colors"
                        >
                            ← All Sims
                        </button>
                    </div>
                    <Suspense fallback={<SimulationLoader />}>
                        <SimComponent />
                    </Suspense>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="text-center space-y-1">
                        <h3 className="text-sm font-semibold text-foreground">Interactive Simulation Library</h3>
                        <p className="text-[11px] text-muted-foreground">
                            Explore B.Tech CS, Operating Systems, Algorithms, and Physics simulations
                        </p>
                    </div>

                    {(Object.keys(groupedSims) as SimulationDomain[]).map((domain) => {
                        const sims = groupedSims[domain];
                        if (!sims.length) return null;
                        return (
                            <div key={domain} className="space-y-2">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-400">
                                    {DOMAIN_ICONS[domain]}
                                    <span>{DOMAIN_LABELS[domain]}</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {sims.map((sim) => (
                                        <button
                                            key={sim.id}
                                            onClick={() => setPickerSim(sim.id)}
                                            className="p-3 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] text-left transition-all duration-200 group flex items-start gap-3"
                                        >
                                            <span className="text-xl group-hover:scale-110 transition-transform">{sim.emoji}</span>
                                            <div>
                                                <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">{sim.title}</h4>
                                                <p className="text-[10px] text-neutral-400 leading-snug mt-0.5">{sim.description}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
