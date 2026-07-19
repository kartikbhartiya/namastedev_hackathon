"use client";
import { useState, useEffect, useRef } from "react";
import { SimulationControls, type ControlConfig } from "../SimulationControls";
import { Button } from "@/components/ui/button";

export function WaveInterferenceSim() {
    const [amplitude1, setAmplitude1] = useState(30); // px
    const [amplitude2, setAmplitude2] = useState(30); // px
    const [frequency, setFrequency] = useState(2); // Hz equivalent
    const [phase, setPhase] = useState(0); // phase difference (degrees)
    const [time, setTime] = useState(0);
    const [running, setRunning] = useState(true);

    const animRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number>(0);

    useEffect(() => {
        if (!running) return;

        lastTimeRef.current = performance.now();
        const tick = (now: number) => {
            const dt = (now - lastTimeRef.current) / 1000;
            lastTimeRef.current = now;
            setTime((t) => t + dt * 2);
            animRef.current = requestAnimationFrame(tick);
        };
        animRef.current = requestAnimationFrame(tick);

        return () => {
            if (animRef.current) cancelAnimationFrame(animRef.current);
        };
    }, [running]);

    const width = 700;
    const height = 300;
    const padding = 40;
    const graphWidth = width - 2 * padding;
    const splitH = height / 3;

    // Phase difference in radians
    const phi = (phase * Math.PI) / 180;

    // Generate path points
    const getWavePath = (amp: number, freq: number, phaseShift: number, yOffset: number) => {
        let path = `M ${padding} ${yOffset}`;
        const steps = 150;
        for (let i = 0; i <= steps; i++) {
            const pct = i / steps;
            const x = padding + pct * graphWidth;
            // Wave equation: y(x, t) = A * sin(k*x - w*t + phi)
            // scale factor k = 0.05, w = 1.5
            const y = yOffset - amp * Math.sin(0.04 * (x - padding) - time * freq + phaseShift);
            path += ` L ${x} ${y}`;
        }
        return path;
    };

    // Wave 1
    const wave1Path = getWavePath(amplitude1, frequency, 0, splitH * 0.5);
    // Wave 2
    const wave2Path = getWavePath(amplitude2, frequency, phi, splitH * 1.5);
    // Superposition wave
    // For superposition, we add the amplitudes together point-by-point
    const getSuperpositionPath = (yOffset: number) => {
        let path = `M ${padding} ${yOffset}`;
        const steps = 150;
        for (let i = 0; i <= steps; i++) {
            const pct = i / steps;
            const x = padding + pct * graphWidth;
            const y1 = amplitude1 * Math.sin(0.04 * (x - padding) - time * frequency + 0);
            const y2 = amplitude2 * Math.sin(0.04 * (x - padding) - time * frequency + phi);
            const y = yOffset - (y1 + y2);
            path += ` L ${x} ${y}`;
        }
        return path;
    };

    const combinedPath = getSuperpositionPath(splitH * 2.5);

    const controls: ControlConfig[] = [
        { type: 'slider', label: 'Wave 1 Amplitude', key: 'amplitude1', min: 10, max: 40, step: 5, value: amplitude1, unit: 'px' },
        { type: 'slider', label: 'Wave 2 Amplitude', key: 'amplitude2', min: 10, max: 40, step: 5, value: amplitude2, unit: 'px' },
        { type: 'slider', label: 'Wave Frequency', key: 'frequency', min: 1, max: 4, step: 0.5, value: frequency, unit: 'Hz' },
        { type: 'slider', label: 'Phase Difference (Δφ)', key: 'phase', min: 0, max: 360, step: 15, value: phase, unit: '°' },
    ];

    const handleChange = (key: string, val: any) => {
        if (key === 'amplitude1') setAmplitude1(val);
        else if (key === 'amplitude2') setAmplitude2(val);
        else if (key === 'frequency') setFrequency(val);
        else if (key === 'phase') setPhase(val);
    };

    const handleReset = () => {
        setAmplitude1(30);
        setAmplitude2(30);
        setFrequency(2);
        setPhase(0);
    };

    const isConstructive = phase < 60 || phase > 300;
    const isDestructive = phase >= 120 && phase <= 240;

    return (
        <div className="space-y-4">
            <div className="relative w-full bg-black/40 rounded-xl border border-white/[0.06] overflow-hidden">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ aspectRatio: `${width}/${height}` }}>
                    <rect width={width} height={height} fill="url(#grid)" />

                    {/* Splitter lines */}
                    <line x1={padding} y1={splitH} x2={width - padding} y2={splitH} stroke="#ffffff08" strokeWidth={1} />
                    <line x1={padding} y1={splitH * 2} x2={width - padding} y2={splitH * 2} stroke="#ffffff08" strokeWidth={1} />

                    {/* Wave 1 */}
                    <line x1={padding} y1={splitH * 0.5} x2={width - padding} y2={splitH * 0.5} stroke="#ffffff04" strokeWidth={1} strokeDasharray="3 3" />
                    <path d={wave1Path} fill="none" stroke="#60a5fa" strokeWidth={1.5} opacity={0.8} />
                    <text x={padding + 10} y={20} fill="#60a5fa" fontSize={8} fontWeight="semibold" fontFamily="sans-serif">WAVE 1 (A₁ = {amplitude1}px)</text>

                    {/* Wave 2 */}
                    <line x1={padding} y1={splitH * 1.5} x2={width - padding} y2={splitH * 1.5} stroke="#ffffff04" strokeWidth={1} strokeDasharray="3 3" />
                    <path d={wave2Path} fill="none" stroke="#f87171" strokeWidth={1.5} opacity={0.8} />
                    <text x={padding + 10} y={splitH + 20} fill="#f87171" fontSize={8} fontWeight="semibold" fontFamily="sans-serif">WAVE 2 (A₂ = {amplitude2}px, Δφ = {phase}°)</text>

                    {/* Resultant Superposition Wave */}
                    <line x1={padding} y1={splitH * 2.5} x2={width - padding} y2={splitH * 2.5} stroke="#ffffff04" strokeWidth={1} strokeDasharray="3 3" />
                    <path d={combinedPath} fill="none" stroke="#c084fc" strokeWidth={2.5} />
                    <text x={padding + 10} y={splitH * 2 + 20} fill="#c084fc" fontSize={9} fontWeight="bold" fontFamily="sans-serif">SUPERPOSITION WAVE (Y = y₁ + y₂)</text>
                </svg>
            </div>

            <div className="flex gap-2">
                <Button
                    onClick={() => setRunning(!running)}
                    size="sm"
                    className="flex-1 bg-white hover:bg-neutral-200 text-black text-xs h-8"
                >
                    {running ? "Pause Wave Wavefronts" : "Resume Waves"}
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
                    label: "Wave Superposition Interference",
                    formula: isConstructive ? "Constructive interference: Waves align in phase" : isDestructive ? "Destructive interference: Waves out of phase (canceling)" : "Partial Interference: Intermediate phase difference",
                    values: [
                        { label: "Phase Δφ", value: `${phase}° (${(phase / 180).toFixed(2)}π rad)` },
                        { label: "Max Resultant Amp", value: `${amplitude1 + amplitude2}px` },
                        { label: "Actual Peak Amp", value: `${Math.round(Math.sqrt(amplitude1 * amplitude1 + amplitude2 * amplitude2 + 2 * amplitude1 * amplitude2 * Math.cos(phi)))}px` }
                    ]
                }}
            />
        </div>
    );
}
