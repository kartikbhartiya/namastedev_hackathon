import { useMemo } from "react";
import type {
    DynamicSimConfig,
    SimElement,
    SimCircle,
    SimLine,
    SimArrow,
    SimCurve,
    SimBar,
    SimFieldLines,
    SimParticle,
    SimText,
    SimRect,
    SimSpring,
    SimWall,
} from "@/lib/aiTutor";

interface DynamicSimRendererProps {
    config: DynamicSimConfig;
    paramValues: Record<string, number>;
}

function evalExpr(expr: string | number, params: Record<string, number>): number {
    if (typeof expr === "number") return expr;
    try {
        const keys = Object.keys(params);
        const values = Object.values(params);
        const fn = new Function(...keys, `return ${expr}`);
        const result = fn(...values);
        return Number.isFinite(result) ? result : 0;
    } catch {
        return Number(expr) || 0;
    }
}

function evalArrayExpr(expr: string, params: Record<string, number>): number[] {
    try {
        const keys = Object.keys(params);
        const values = Object.values(params);
        const fn = new Function(...keys, `return ${expr}`);
        const result = fn(...values);
        return Array.isArray(result) ? result : [];
    } catch {
        return [];
    }
}

function renderCircle(el: SimCircle, params: Record<string, number>, i: number) {
    const cx = evalExpr(el.cx, params);
    const cy = evalExpr(el.cy, params);
    const r = Math.max(1, evalExpr(el.r, params));

    return (
        <g key={`circle-${i}`}>
            <circle cx={cx} cy={cy} r={r + 4} fill="none" stroke={el.fill} strokeWidth={1} opacity={0.2} />
            <circle cx={cx} cy={cy} r={r} fill={el.fill} stroke={el.stroke || "none"} strokeWidth={el.stroke ? 1.5 : 0} />
            {el.label && (
                <text x={cx} y={cy + 4} fill="#ffffffee" fontSize={Math.min(10, r * 0.8)} textAnchor="middle" dominantBaseline="middle" fontFamily="'Inter', sans-serif" fontWeight={500}>
                    {el.label}
                </text>
            )}
        </g>
    );
}

function renderLine(el: SimLine, params: Record<string, number>, i: number) {
    return (
        <line
            key={`line-${i}`}
            x1={evalExpr(el.x1, params)}
            y1={evalExpr(el.y1, params)}
            x2={evalExpr(el.x2, params)}
            y2={evalExpr(el.y2, params)}
            stroke={el.stroke}
            strokeWidth={el.strokeWidth || 1}
            strokeDasharray={el.dashed ? "6 3" : undefined}
        />
    );
}

function renderArrow(el: SimArrow, params: Record<string, number>, i: number) {
    const x1 = evalExpr(el.x1, params);
    const y1 = evalExpr(el.y1, params);
    const x2 = evalExpr(el.x2, params);
    const y2 = evalExpr(el.y2, params);
    const markerId = `arrowhead-${i}`;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return null;

    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const nx = -dy / len;
    const ny = dx / len;

    return (
        <g key={`arrow-${i}`}>
            <defs>
                <marker id={markerId} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                    <polygon points="0 0, 8 4, 0 8" fill={el.stroke} />
                </marker>
            </defs>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={el.stroke} strokeWidth={2} markerEnd={`url(#${markerId})`} />
            {el.label && (
                <text x={mx + nx * 14} y={my + ny * 14} fill="#ffffffcc" fontSize={9} textAnchor="middle" dominantBaseline="middle" fontFamily="'Inter', sans-serif">
                    {el.label}
                </text>
            )}
        </g>
    );
}

function renderCurve(el: SimCurve, params: Record<string, number>, i: number, cw: number, ch: number) {
    const steps = 200;
    const xMin = el.xMin;
    const xMax = el.xMax;
    const range = xMax - xMin;

    let curveFn: Function;
    try {
        const keys = Object.keys(params);
        curveFn = new Function("x", ...keys, `return ${el.expression}`);
    } catch {
        return null;
    }
    const paramValues = Object.values(params);

    const yValues: number[] = [];
    for (let s = 0; s <= steps; s++) {
        const x = xMin + (s / steps) * range;
        try {
            const y = curveFn(x, ...paramValues);
            if (Number.isFinite(y)) yValues.push(y);
        } catch { /* skip */ }
    }
    if (yValues.length === 0) return null;

    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);
    const yRange = Math.max(yMax - yMin, 0.001);
    const padding = 0.1;
    const yPadded = yRange * (1 + padding * 2);
    const yCenter = (yMin + yMax) / 2;

    let pathD = "";
    let prevValid = false;

    for (let s = 0; s <= steps; s++) {
        const x = xMin + (s / steps) * range;
        let y: number;
        try {
            y = curveFn(x, ...paramValues) as number;
        } catch {
            y = NaN;
        }

        if (!Number.isFinite(y)) {
            prevValid = false;
            continue;
        }

        const sx = ((x - xMin) / range) * cw;
        const sy = ch / 2 - ((y - yCenter) / yPadded) * ch;

        if (sy < -50 || sy > ch + 50) {
            prevValid = false;
            continue;
        }

        if (!prevValid) {
            pathD += `M ${sx.toFixed(2)} ${sy.toFixed(2)} `;
            prevValid = true;
        } else {
            pathD += `L ${sx.toFixed(2)} ${sy.toFixed(2)} `;
        }
    }

    return (
        <g key={`curve-${i}`}>
            <path d={pathD} fill="none" stroke={el.stroke} strokeWidth={(el.strokeWidth || 2) + 3} opacity={0.15} />
            <path d={pathD} fill="none" stroke={el.stroke} strokeWidth={el.strokeWidth || 2} opacity={0.9} />
        </g>
    );
}

function renderBar(el: SimBar, params: Record<string, number>, i: number, cw: number, ch: number) {
    const values = evalArrayExpr(el.values, params);
    if (values.length === 0) return null;

    const highlightIdx = el.highlightIndex ? Math.floor(evalExpr(el.highlightIndex, params)) : -1;
    const maxVal = Math.max(...values, 1);
    const gap = 4;
    const barW = Math.max(4, (cw - 80 - (values.length - 1) * gap) / values.length);

    return (
        <g key={`bar-${i}`}>
            {values.map((v, j) => {
                const barH = (v / maxVal) * (ch - 80);
                const x = 40 + j * (barW + gap);
                const y = ch - 40 - barH;
                const isHL = j === highlightIdx;
                return (
                    <g key={j}>
                        <rect
                            x={x} y={y} width={barW} height={barH}
                            rx={3}
                            fill={isHL ? (el.highlightFill || "#f59e0b") : el.fill}
                            opacity={isHL ? 1 : 0.7}
                        />
                        <text x={x + barW / 2} y={ch - 26} fontSize={9} fill="#ffffffa0" textAnchor="middle" fontFamily="'Inter', sans-serif">
                            {v}
                        </text>
                    </g>
                );
            })}
        </g>
    );
}

function renderFieldLines(el: SimFieldLines, params: Record<string, number>, i: number) {
    const cx = evalExpr(el.cx, params);
    const cy = evalExpr(el.cy, params);
    const len = Math.max(5, evalExpr(el.length, params));
    const lines: React.ReactNode[] = [];

    for (let n = 0; n < el.count; n++) {
        const angle = (n / el.count) * Math.PI * 2;
        const dir = el.direction === "inward" ? -1 : 1;
        const startR = 12;
        const x1 = cx + Math.cos(angle) * startR * dir;
        const y1 = cy + Math.sin(angle) * startR * dir;
        const x2 = cx + Math.cos(angle) * len * dir;
        const y2 = cy + Math.sin(angle) * len * dir;

        lines.push(
            <line
                key={n}
                x1={x1} y1={y1}
                x2={x2} y2={y2}
                stroke={el.stroke}
                strokeWidth={1.5}
                opacity={0.5}
            />
        );
    }

    return <g key={`fieldlines-${i}`}>{lines}</g>;
}

function renderParticle(el: SimParticle, params: Record<string, number>, i: number) {
    const cx = evalExpr(el.cx, params);
    const cy = evalExpr(el.cy, params);
    const spread = evalExpr(el.spread, params);
    const dots: React.ReactNode[] = [];

    for (let n = 0; n < el.count; n++) {
        const angle = n * 2.39996;
        const r = Math.sqrt(n / el.count) * spread;
        dots.push(
            <circle
                key={n}
                cx={cx + Math.cos(angle) * r}
                cy={cy + Math.sin(angle) * r}
                r={el.radius}
                fill={el.fill}
                opacity={0.5 + 0.5 * (1 - n / el.count)}
            />
        );
    }

    return <g key={`particle-${i}`}>{dots}</g>;
}

function renderText(el: SimText, params: Record<string, number>, i: number) {
    return (
        <text
            key={`text-${i}`}
            x={evalExpr(el.x, params)}
            y={evalExpr(el.y, params)}
            fill={el.fill}
            fontSize={el.fontSize || 12}
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily="'Inter', sans-serif"
        >
            {el.content}
        </text>
    );
}

function renderRect(el: SimRect, params: Record<string, number>, i: number) {
    return (
        <rect
            key={`rect-${i}`}
            x={evalExpr(el.x, params)}
            y={evalExpr(el.y, params)}
            width={evalExpr(el.width, params)}
            height={evalExpr(el.height, params)}
            fill={el.fill}
            stroke={el.stroke || "none"}
            rx={el.rx || 0}
        />
    );
}

function renderSpring(el: SimSpring, params: Record<string, number>, i: number) {
    const x1 = evalExpr(el.x1, params);
    const y1 = evalExpr(el.y1, params);
    const x2 = evalExpr(el.x2, params);
    const y2 = evalExpr(el.y2, params);

    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return null;

    const angle = Math.atan2(dy, dx);
    const coils = Math.max(1, Math.round(evalExpr(el.coils, params)));
    const width = evalExpr(el.width, params);

    let path = `M ${x1} ${y1}`;
    const endLen = 10;
    if (len > endLen * 2) {
        path += ` L ${x1 + Math.cos(angle) * endLen} ${y1 + Math.sin(angle) * endLen}`;

        const coilLen = (len - endLen * 2) / coils;
        const normX = -Math.sin(angle) * width / 2;
        const normY = Math.cos(angle) * width / 2;

        for (let c = 0; c < coils; c++) {
            const startDist = endLen + c * coilLen;
            const mid1Dist = startDist + coilLen * 0.25;
            const mid2Dist = startDist + coilLen * 0.75;
            const endDist = startDist + coilLen;

            path += ` L ${x1 + Math.cos(angle) * mid1Dist + normX} ${y1 + Math.sin(angle) * mid1Dist + normY}`;
            path += ` L ${x1 + Math.cos(angle) * mid2Dist - normX} ${y1 + Math.sin(angle) * mid2Dist - normY}`;
            path += ` L ${x1 + Math.cos(angle) * endDist} ${y1 + Math.sin(angle) * endDist}`;
        }
    } else {
        path += ` L ${x2} ${y2}`;
    }

    return (
        <g key={`spring-${i}`}>
            <path d={path} fill="none" stroke={el.stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            <path d={path} fill="none" stroke="#ffffff" strokeWidth={0.5} opacity={0.3} strokeLinecap="round" strokeLinejoin="round" />
        </g>
    );
}

function renderWall(el: SimWall, params: Record<string, number>, i: number) {
    const x = evalExpr(el.x, params);
    const y = evalExpr(el.y, params);
    const w = evalExpr(el.width, params);
    const h = evalExpr(el.height, params);
    const isHorz = el.orientation === "horizontal";

    return (
        <g key={`wall-${i}`}>
            <rect x={x} y={y} width={w} height={h} fill={el.fill || "#222222"} stroke="#555555" strokeWidth={1} />
            <defs>
                <pattern id={`hatch-${i}`} width={8} height={8} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <line x1={0} y1={0} x2={0} y2={8} stroke="#555555" strokeWidth={1.5} opacity={0.5} />
                </pattern>
            </defs>
            <rect x={x} y={y} width={w} height={h} fill={`url(#hatch-${i})`} />
            {isHorz ? (
                <line x1={x} y1={y} x2={x + w} y2={y} stroke="#888888" strokeWidth={3} />
            ) : (
                <line x1={x + w} y1={y} x2={x + w} y2={y + h} stroke="#888888" strokeWidth={3} />
            )}
        </g>
    );
}

function renderElement(el: SimElement, params: Record<string, number>, i: number, cw: number, ch: number): React.ReactNode {
    switch (el.type) {
        case "circle": return renderCircle(el, params, i);
        case "line": return renderLine(el, params, i);
        case "arrow": return renderArrow(el, params, i);
        case "curve": return renderCurve(el, params, i, cw, ch);
        case "bar": return renderBar(el, params, i, cw, ch);
        case "fieldLines": return renderFieldLines(el, params, i);
        case "particle": return renderParticle(el, params, i);
        case "text": return renderText(el, params, i);
        case "rect": return renderRect(el, params, i);
        case "spring": return renderSpring(el, params, i);
        case "wall": return renderWall(el, params, i);
        default: return null;
    }
}

export function DynamicSimRenderer({ config, paramValues }: DynamicSimRendererProps) {
    const { canvasWidth: cw, canvasHeight: ch, elements } = config;

    const renderedElements = elements.map((el, i) => renderElement(el, paramValues, i, cw, ch));

    return (
        <div className="relative w-full bg-black/40 rounded-xl border border-border overflow-hidden">
            <svg
                viewBox={`0 0 ${cw} ${ch}`}
                className="w-full"
                style={{ aspectRatio: `${cw}/${ch}` }}
            >
                <defs>
                    <pattern id="dynGrid" width={50} height={50} patternUnits="userSpaceOnUse">
                        <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#ffffff06" strokeWidth={0.5} />
                    </pattern>
                </defs>
                <rect width={cw} height={ch} fill="url(#dynGrid)" />

                <line x1={0} y1={ch / 2} x2={cw} y2={ch / 2} stroke="#ffffff08" strokeWidth={1} />
                <line x1={cw / 2} y1={0} x2={cw / 2} y2={ch} stroke="#ffffff08" strokeWidth={1} />

                {renderedElements}
            </svg>
        </div>
    );
}
