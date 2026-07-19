"use client";
import { useState, useEffect, useRef } from "react";
import { SimulationControls, type ControlConfig } from "../SimulationControls";
import { Button } from "@/components/ui/button";

const G = 9.81;

export function ProjectileMotionSim() {
    const [velocity, setVelocity] = useState(40); // m/s
    const [angle, setAngle] = useState(45); // degrees
    const [gravity, setGravity] = useState(9.8); // m/s²
    const [time, setTime] = useState(0);
    const [running, setRunning] = useState(false);

    const animRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number>(0);

    // Theoretical metrics
    const theta = (angle * Math.PI) / 180;
    const tFlight = (2 * velocity * Math.sin(theta)) / gravity;
    const maxH = (velocity * velocity * Math.sin(theta) * Math.sin(theta)) / (2 * gravity);
    const range = (velocity * velocity * Math.sin(2 * theta)) / gravity;

    useEffect(() => {
        if (!running) return;

        lastTimeRef.current = performance.now();
        const tick = (now: number) => {
            const dt = (now - lastTimeRef.current) / 1000;
            lastTimeRef.current = now;

            setTime((t) => {
                const nextT = t + dt * 0.8; // Slow down slightly for easier tracking
                if (nextT >= tFlight) {
                    setRunning(false);
                    return tFlight;
                }
                return nextT;
            });

            animRef.current = requestAnimationFrame(tick);
        };
        animRef.current = requestAnimationFrame(tick);

        return () => {
            if (animRef.current) cancelAnimationFrame(animRef.current);
        };
    }, [running, tFlight, gravity]);

    // Canvas mapping
    const canvasW = 700;
    const canvasH = 300;
    const originX = 50;
    const originY = 260;

    // Scaling factors based on max range/height to fit nicely
    const scaleX = (canvasW - 100) / Math.max(range, 50);
    const scaleY = (canvasH - 80) / Math.max(maxH, 20);
    const scale = Math.min(scaleX, scaleY);

    const getPositionAt = (t: number) => {
        const x = velocity * Math.cos(theta) * t;
        const y = velocity * Math.sin(theta) * t - 0.5 * gravity * t * t;
        return {
            x: originX + x * scale,
            y: originY - y * scale,
        };
    };

    const currentPos = getPositionAt(time);

    // Build path for trajectory outline
    let pathD = `M ${originX} ${originY}`;
    const steps = 100;
    for (let i = 1; i <= steps; i++) {
        const t = (i / steps) * tFlight;
        const pos = getPositionAt(t);
        pathD += ` L ${pos.x} ${pos.y}`;
    }

    const handleFire = () => {
        setTime(0);
        setRunning(true);
    };

    const handleReset = () => {
        setRunning(false);
        setTime(0);
        setVelocity(40);
        setAngle(45);
        setGravity(9.8);
    };

    const controls: ControlConfig[] = [
        { type: 'slider', label: 'Initial Velocity', key: 'velocity', min: 10, max: 60, step: 2, value: velocity, unit: 'm/s' },
        { type: 'slider', label: 'Launch Angle', key: 'angle', min: 15, max: 80, step: 5, value: angle, unit: '°' },
        { type: 'slider', label: 'Gravitational acceleration', key: 'gravity', min: 4, max: 20, step: 0.5, value: gravity, unit: 'm/s²' },
    ];

    const handleChange = (key: string, val: any) => {
        if (running) return;
        if (key === 'velocity') setVelocity(val);
        else if (key === 'angle') setAngle(val);
        else if (key === 'gravity') setGravity(val);
    };

    return (
        <div className="space-y-4">
            <div className="relative w-full bg-black/40 rounded-xl border border-white/[0.06] overflow-hidden">
                <svg viewBox={`0 0 ${canvasW} ${canvasH}`} className="w-full" style={{ aspectRatio: `${canvasW}/${canvasH}` }}>
                    {/* Grid */}
                    <rect width={canvasW} height={canvasH} fill="url(#grid)" />

                    {/* Ground line */}
                    <line x1={0} y1={originY} x2={canvasW} y2={originY} stroke="#444" strokeWidth={2} />
                    <line x1={0} y1={originY} x2={canvasW} y2={originY} stroke="#ffffff08" strokeWidth={1} strokeDasharray="3 3" />

                    {/* Launch Platform / Cannon */}
                    <line x1={originX} y1={originY} x2={originX + 25 * Math.cos(theta)} y2={originY - 25 * Math.sin(theta)} stroke="#888" strokeWidth={6} strokeLinecap="round" />
                    <circle cx={originX} cy={originY} r={8} fill="#444" />

                    {/* Path Trail */}
                    <path d={pathD} fill="none" stroke="#ffffff15" strokeWidth={2} strokeDasharray="4 4" />
                    
                    {/* Fired Trajectory Path */}
                    {time > 0 && (
                        <path
                            d={(() => {
                                let path = `M ${originX} ${originY}`;
                                const stepsDone = Math.floor((time / tFlight) * steps);
                                for (let i = 1; i <= stepsDone; i++) {
                                    const t = (i / steps) * tFlight;
                                    const pos = getPositionAt(t);
                                    path += ` L ${pos.x} ${pos.y}`;
                                }
                                const posNow = getPositionAt(time);
                                path += ` L ${posNow.x} ${posNow.y}`;
                                return path;
                            })()}
                            fill="none"
                            stroke="#eab308"
                            strokeWidth={2.5}
                        />
                    )}

                    {/* Moving Projectile */}
                    <circle cx={currentPos.x} cy={currentPos.y} r={7} fill="#ef4444" stroke="#ffffff30" strokeWidth={1} />
                    {/* Shadow on ground */}
                    <ellipse cx={currentPos.x} cy={originY} rx={7} ry={2} fill="#00000060" />

                    {/* Peak Height Indicator */}
                    <line x1={originX + (range / 2) * scale} y1={originY - maxH * scale} x2={originX + (range / 2) * scale} y2={originY} stroke="#ffffff05" strokeWidth={1} strokeDasharray="2 2" />
                    <circle cx={originX + (range / 2) * scale} cy={originY - maxH * scale} r={3} fill="#10b981" opacity={0.6} />

                    {/* Live values */}
                    <g transform={`translate(${canvasW - 160}, 30)`} opacity={0.8}>
                        <rect width={140} height={70} rx={8} fill="#ffffff04" stroke="#ffffff10" strokeWidth={1} />
                        <text x={10} y={20} fill="#ffffffa0" fontSize={9} fontFamily="monospace">X: {(velocity * Math.cos(theta) * time).toFixed(1)} m</text>
                        <text x={10} y={38} fill="#ffffffa0" fontSize={9} fontFamily="monospace">Y: {Math.max(0, velocity * Math.sin(theta) * time - 0.5 * gravity * time * time).toFixed(1)} m</text>
                        <text x={10} y={56} fill="#ffffffa0" fontSize={9} fontFamily="monospace">T: {time.toFixed(2)} s</text>
                    </g>
                </svg>
            </div>

            <div className="flex gap-2">
                <Button
                    onClick={handleFire}
                    disabled={running}
                    size="sm"
                    className="flex-1 bg-white hover:bg-neutral-200 text-black text-xs h-8"
                >
                    Fire Projectile
                </Button>
                <Button onClick={handleReset} variant="outline" size="sm" className="border-white/10 hover:bg-white/5 h-8 text-xs text-white">
                    Reset parameters
                </Button>
            </div>

            <SimulationControls
                controls={controls}
                onChange={handleChange}
                onReset={handleReset}
                equation={{
                    label: "Theoretical Kinematic Metrics",
                    formula: "R = (v₀² sin 2θ) / g",
                    values: [
                        { label: "Max Range (R)", value: `${range.toFixed(1)}m` },
                        { label: "Apex Height (H)", value: `${maxH.toFixed(1)}m` },
                        { label: "Total Flight Time", value: `${tFlight.toFixed(2)}s` }
                    ]
                }}
            />
        </div>
    );
}
