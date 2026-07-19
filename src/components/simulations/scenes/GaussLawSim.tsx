"use client";
import { useState } from "react";
import { SimulationControls, type ControlConfig } from "../SimulationControls";

const EPSILON_0 = 8.854e-2; // scaled epsilon

export function GaussLawSim() {
    const [shape, setShape] = useState("sphere");
    const [config, setConfig] = useState("point");
    const [charge, setCharge] = useState(2); // microcoulombs
    const [radius, setRadius] = useState(120); // px

    const flux = charge / EPSILON_0;

    const width = 700;
    const height = 300;
    const centerX = width / 2;
    const centerY = height / 2;

    const controls: ControlConfig[] = [
        {
            type: 'select', label: 'Surface Shape', key: 'shape', value: shape, options: [
                { value: 'sphere', label: 'Sphere (Circle)' },
                { value: 'cube', label: 'Cube (Square)' },
                { value: 'cylinder', label: 'Cylinder (Oval)' }
            ]
        },
        {
            type: 'select', label: 'Charge Configuration', key: 'config', value: config, options: [
                { value: 'point', label: 'Point Charge' },
                { value: 'ring', label: 'Charged Ring' },
                { value: 'line', label: 'Charged Line' }
            ]
        },
        { type: 'slider', label: 'Enclosed Charge (Q)', key: 'charge', min: -5, max: 5, step: 1, value: charge, unit: 'μC' },
        { type: 'slider', label: 'Gaussian Radius (r)', key: 'radius', min: 60, max: 180, step: 10, value: radius, unit: 'px' },
    ];

    const handleChange = (key: string, val: any) => {
        if (key === 'shape') setShape(val);
        else if (key === 'config') setConfig(val);
        else if (key === 'charge') setCharge(val);
        else if (key === 'radius') setRadius(val);
    };

    const handleReset = () => {
        setShape("sphere");
        setConfig("point");
        setCharge(2);
        setRadius(120);
    };

    // Calculate charge locations based on config
    const getCharges = () => {
        if (config === "point") {
            return [{ x: centerX, y: centerY, q: charge }];
        } else if (config === "ring") {
            const count = 6;
            const rRing = 40;
            const charges = [];
            for (let i = 0; i < count; i++) {
                const a = (i / count) * Math.PI * 2;
                charges.push({
                    x: centerX + rRing * Math.cos(a),
                    y: centerY + rRing * Math.sin(a),
                    q: charge / count
                });
            }
            return charges;
        } else { // line
            const count = 7;
            const length = 120;
            const charges = [];
            for (let i = 0; i < count; i++) {
                charges.push({
                    x: centerX - length / 2 + (i / (count - 1)) * length,
                    y: centerY,
                    q: charge / count
                });
            }
            return charges;
        }
    };

    const charges = getCharges();

    // Generate field lines
    const getFieldLines = () => {
        if (charge === 0) return [];
        const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
        const count = 16;
        const lineLen = 80;

        for (const c of charges) {
            for (let i = 0; i < count; i++) {
                const a = (i / count) * Math.PI * 2;
                const dir = charge > 0 ? 1 : -1;
                // Start line offset slightly from charge center
                const offset = 8;
                lines.push({
                    x1: c.x + offset * Math.cos(a),
                    y1: c.y + offset * Math.sin(a),
                    x2: c.x + (offset + lineLen) * Math.cos(a) * dir,
                    y2: c.y + (offset + lineLen) * Math.sin(a) * dir,
                });
            }
        }
        return lines;
    };

    const fieldLines = getFieldLines();

    return (
        <div className="space-y-4">
            <div className="relative w-full bg-black/40 rounded-xl border border-white/[0.06] overflow-hidden">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ aspectRatio: `${width}/${height}` }}>
                    <rect width={width} height={height} fill="url(#grid)" />

                    {/* Render Electric Field Lines */}
                    {fieldLines.map((line, idx) => (
                        <g key={idx}>
                            <line
                                x1={line.x1}
                                y1={line.y1}
                                x2={line.x2}
                                y2={line.y2}
                                stroke={charge > 0 ? "#f87171" : "#60a5fa"}
                                strokeWidth={1}
                                strokeDasharray="3 3"
                                opacity={0.4}
                            />
                            {/* Direction Arrow */}
                            <circle
                                cx={(line.x1 + line.x2) / 2}
                                cy={(line.y1 + line.y2) / 2}
                                r={2}
                                fill={charge > 0 ? "#ef4444" : "#3b82f6"}
                            />
                        </g>
                    ))}

                    {/* Render Gaussian Surface */}
                    {shape === "sphere" && (
                        <circle
                            cx={centerX}
                            cy={centerY}
                            r={radius}
                            fill="none"
                            stroke="#c084fc"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                        />
                    )}
                    {shape === "cube" && (
                        <rect
                            x={centerX - radius}
                            y={centerY - radius}
                            width={radius * 2}
                            height={radius * 2}
                            fill="none"
                            stroke="#c084fc"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                        />
                    )}
                    {shape === "cylinder" && (
                        <rect
                            x={centerX - radius * 1.2}
                            y={centerY - radius * 0.7}
                            width={radius * 2.4}
                            height={radius * 1.4}
                            rx={radius * 0.4}
                            fill="none"
                            stroke="#c084fc"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                        />
                    )}

                    {/* Surface Label */}
                    <text
                        x={centerX + radius - 40}
                        y={centerY - radius + 15}
                        fill="#c084fc"
                        fontSize={8}
                        fontWeight="semibold"
                        fontFamily="sans-serif"
                    >
                        GAUSSIAN SURFACE
                    </text>

                    {/* Render Charges */}
                    {charges.map((c, idx) => (
                        <g key={idx}>
                            <circle
                                cx={c.x}
                                cy={c.y}
                                r={7}
                                fill={charge > 0 ? "#ef4444" : charge < 0 ? "#3b82f6" : "#737373"}
                                stroke="#ffffff30"
                                strokeWidth={1}
                            />
                            <text
                                x={c.x}
                                y={c.y + 3}
                                fill="#ffffff"
                                fontSize={9}
                                textAnchor="middle"
                                fontFamily="sans-serif"
                                fontWeight="bold"
                            >
                                {charge > 0 ? "+" : charge < 0 ? "-" : "0"}
                            </text>
                        </g>
                    ))}
                </svg>
            </div>

            <SimulationControls
                controls={controls}
                onChange={handleChange}
                onReset={handleReset}
                equation={{
                    label: "Gauss's Law Integral",
                    formula: "∮ E · dA = Q_enclosed / ε₀",
                    values: [
                        { label: "Q (Enclosed)", value: `${charge} μC` },
                        { label: "Net Electric Flux (Φ)", value: `${flux.toFixed(1)} × 10³ N·m²/C` }
                    ]
                }}
            />
        </div>
    );
}
