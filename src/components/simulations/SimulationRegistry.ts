"use client";
/**
 * Simulation Registry — maps topic keywords to simulation components.
 * The AI uses these keywords to auto-detect which simulation to trigger.
 */

export type SimulationDomain = 'physics' | 'math' | 'algorithms' | 'conceptual';

export interface SimulationEntry {
    id: string;
    title: string;
    description: string;
    domain: SimulationDomain;
    keywords: string[];
    emoji: string;
}

export const SIMULATION_REGISTRY: SimulationEntry[] = [
    {
        id: 'gauss_law',
        title: "Gauss's Law",
        description: 'Electric flux through Gaussian surfaces with charge configurations',
        domain: 'physics',
        keywords: ['gauss', 'electric flux', 'gaussian surface', 'enclosed charge', 'coulomb', 'electric field'],
        emoji: '⚡',
    },
    {
        id: 'wave_interference',
        title: 'Wave Interference',
        description: 'Constructive and destructive wave superposition',
        domain: 'physics',
        keywords: ['wave', 'interference', 'superposition', 'constructive', 'destructive', 'amplitude', 'frequency'],
        emoji: '🌊',
    },
    {
        id: 'projectile_motion',
        title: 'Projectile Motion',
        description: 'Trajectory with adjustable angle, velocity, and gravity',
        domain: 'physics',
        keywords: ['projectile', 'trajectory', 'parabola', 'launch angle', 'range', 'kinematics'],
        emoji: '🎯',
    },
    {
        id: 'sorting_algorithms',
        title: 'Sorting Algorithms',
        description: 'Step-by-step visualization of Bubble, Selection, and Insertion sort',
        domain: 'algorithms',
        keywords: ['sort', 'bubble sort', 'selection sort', 'insertion sort', 'algorithm', 'sorting'],
        emoji: '📊',
    },
    {
        id: 'graph_plotter',
        title: 'Function Plotter',
        description: 'Plot mathematical functions (sin, cos, polynomial, exponential)',
        domain: 'math',
        keywords: ['graph', 'plot', 'function', 'sin', 'cos', 'polynomial', 'exponential', 'equation', 'curve'],
        emoji: '📈',
    },
    {
        id: 'pendulum',
        title: 'Simple Pendulum',
        description: 'Simple harmonic motion with energy visualization',
        domain: 'physics',
        keywords: ['pendulum', 'harmonic', 'oscillation', 'shm', 'simple harmonic motion', 'period'],
        emoji: '🔄',
    },
];

export function detectSimulation(text: string): SimulationEntry | null {
    const lower = text.toLowerCase();
    let bestMatch: SimulationEntry | null = null;
    let bestScore = 0;

    for (const sim of SIMULATION_REGISTRY) {
        let score = 0;
        for (const keyword of sim.keywords) {
            if (lower.includes(keyword)) {
                score += keyword.length;
            }
        }
        if (score > bestScore) {
            bestScore = score;
            bestMatch = sim;
        }
    }

    return bestScore > 0 ? bestMatch : null;
}

export function getSimulationsByDomain(): Record<SimulationDomain, SimulationEntry[]> {
    const grouped: Record<SimulationDomain, SimulationEntry[]> = {
        physics: [],
        math: [],
        algorithms: [],
        conceptual: [],
    };
    for (const sim of SIMULATION_REGISTRY) {
        grouped[sim.domain].push(sim);
    }
    return grouped;
}
