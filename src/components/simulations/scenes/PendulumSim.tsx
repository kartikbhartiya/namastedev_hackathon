"use client";
import { useState, useEffect, useRef } from "react";
import { SimulationControls, type ControlConfig } from "../SimulationControls";
import { Button } from "@/components/ui/button";

const G = 9.81;

export function PendulumSim() {
    const [length, setLength] = useState(150); // px
    const [angle0, setAngle0] = useState(30); // degrees
    const [damping, setDamping] = useState(0.1);
    const [time, setTime] = useState(0);
    const [running, setRunning] = useState(true);

    const animRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number>(0);

    const angleRef = useRef(angle0 * Math.PI / 180);
    const velocityRef = useRef(0);

    // Reset dynamics when angle0 changes
    useEffect(() => {
        angleRef.current = angle0 * Math.PI / 180;
        velocityRef.current = 0;
    }, [angle0]);

    useEffect(() => {
        if (!running) {
            if (animRef.current) cancelAnimationFrame(animRef.current);
            return;
        }

        lastTimeRef.current = performance.now();
        const tick = (now: number) => {
            const dt = Math.min((now - lastTimeRef.current) / 1000, 0.03) * 1.5; // Speed up slightly
            lastTimeRef.current = now;

            // Physics calculation
            // d²θ/dt² = -(g/L) * sin(θ) - b*v
            // Scale length for calculations: length/50
            const lScale = length / 50;
            const acc = -(G / lScale) * Math.sin(angleRef.current) - damping * velocityRef.current;
            velocityRef.current += acc * dt;
            angleRef.current += velocityRef.current * dt;

            setTime((t) => t + dt);
            animRef.current = requestAnimationFrame(tick);
        };
        animRef.current = requestAnimationFrame(tick);

        return () => {
            if (animRef.current) cancelAnimationFrame(animRef.current);
        };
    }, [running, length, damping]);

    // Canvas sizes
    const width = 700;
    const height = 300;
    const pivotX = width / 2;
    const pivotY = 40;

    const currentAngle = angleRef.current;
    const bobX = pivotX + length * Math.sin(currentAngle);
    const bobY = pivotY + length * Math.cos(currentAngle);

    // Energy Calculations
    const lScale = length / 50;
    const mass = 1.0;
    const heightDiff = lScale * (1 - Math.cos(currentAngle));
    const pe = mass * G * heightDiff;
    const ke = 0.5 * mass * (velocityRef.current * lScale) * (velocityRef.current * lScale);
    const totalEnergy = pe + ke;

    const period = 2 * Math.PI * Math.sqrt(lScale / G);

    const controls: ControlConfig[] = [
        { type: 'slider', label: 'String Length', key: 'length', min: 80, max: 220, step: 10, value: length, unit: 'px' },
        { type: 'slider', label: 'Initial Angle', key: 'angle0', min: 10, max: 75, step: 5, value: angle0, unit: '°' },
        { type: 'slider', label: 'Air Resistance', key: 'damping', min: 0, max: 0.8, step: 0.05, value: damping },
    ];

    const handleChange = (key: string, val: any) => {
        if (key === 'length') setLength(val);
        else if (key === 'angle0') setAngle0(val);
        else if (key === 'damping') setDamping(val);
    };

    const handleReset = () => {
        setLength(150);
        setAngle0(30);
        setDamping(0.1);
        angleRef.current = 30 * Math.PI / 180;
        velocityRef.current = 0;
    };

    return (
        <div className="space-y-4">
            {/* SVG Visualizer */}
            <div className="relative w-full bg-black/40 rounded-xl border border-white/[0.06] overflow-hidden">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ aspectRatio: `${width}/${height}` }}>
                    {/* Background grid */}
                    <defs>
                        <pattern id="grid" width={20} height={20} patternUnits="userSpaceOnUse">
                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#ffffff03" strokeWidth={0.5} />
                        </pattern>
                    </defs>
                    <rect width={width} height={height} fill="url(#grid)" />

                    {/* Support plate */}
                    <rect x={pivotX - 30} y={pivotY - 10} width={60} height={10} fill="#333" rx={2} />
                    <line x1={pivotX - 40} y1={pivotY - 10} x2={pivotX + 40} y2={pivotY - 10} stroke="#555" strokeWidth={1} />

                    {/* Anchor point */}
                    <circle cx={pivotX} cx-={pivotX} cy={pivotY} r={4} fill="#888" />

                    {/* Pendulum string */}
                    <line x1={pivotX} y1={pivotY} x2={bobX} y2={bobY} stroke="#ffffffcc" strokeWidth={2} />

                    {/* Dotted vertical reference */}
                    <line x1={pivotX} y1={pivotY} x2={pivotX} y2={pivotY + length + 20} stroke="#ffffff10" strokeWidth={1} strokeDasharray="4 4" />

                    {/* Angle arc */}
                    {Math.abs(currentAngle) > 0.05 && (
                        <path
                            d={`M ${pivotX} ${pivotY + 30} A 30 30 0 0 ${currentAngle > 0 ? 1 : 0} ${pivotX + 30 * Math.sin(currentAngle)} ${pivotY + 30 * Math.cos(currentAngle)}`}
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth={1.5}
                            opacity={0.7}
                        />
                    )}

                    {/* Bob body */}
                    <circle cx={bobX} cy={bobY} r={16} fill="#3b82f6" stroke="#2563eb" strokeWidth={2} />
                    {/* Reflection highlight */}
                    <circle cx={bobX - 4} cy={bobY - 4} r={4} fill="#ffffff40" />

                    {/* Real-time Energy meters (rendered directly on SVG) */}
                    <g transform="translate(20, 20)">
                        <text x={0} y={12} fill="#ffffffa0" fontSize={10} fontFamily="monospace">PE (Potential)</text>
                        <rect x={90} y={4} width={Math.max(0, pe * 40)} height={8} fill="#eab308" rx={1} />
                        
                        <text x={0} y={28} fill="#ffffffa0" fontSize={10} fontFamily="monospace">KE (Kinetic)</text>
                        <rect x={90} y={20} width={Math.max(0, ke * 40)} height={8} fill="#3b82f6" rx={1} />
                        
                        <text x={0} y={44} fill="#ffffffa0" fontSize={10} fontFamily="monospace">TE (Total)</text>
                        <rect x={90} y={36} width={Math.max(0, totalEnergy * 40)} height={8} fill="#10b981" rx={1} />
                    </g>
                </svg>
            </div>

            {/* Play/Pause controls */}
            <div className="flex gap-2">
                <Button
                    onClick={() => setRunning(!running)}
                    size="sm"
                    className="flex-1 bg-white hover:bg-neutral-200 text-black text-xs h-8"
                >
                    {running ? "Pause Simulation" : "Resume Simulation"}
                </Button>
                <Button onClick={handleReset} variant="outline" size="sm" className="border-white/10 hover:bg-white/5 h-8 text-xs text-white">
                    Reset Dynamics
                </Button>
            </div>

            <SimulationControls
                controls={controls}
                onChange={handleChange}
                onReset={handleReset}
                equation={{
                    label: "Period of Oscillation",
                    formula: "T = 2π√(L/g)",
                    values: [
                        { label: "Theoretical Period", value: `${period.toFixed(2)}s` },
                        { label: "Damping Factor", value: `${damping}` }
                    ]
                }}
            />
        </div>
    );
}
