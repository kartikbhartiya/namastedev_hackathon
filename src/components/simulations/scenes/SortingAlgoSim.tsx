import { useState, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SimulationControls, type ControlConfig } from "../SimulationControls";
import { Play, Pause, RotateCcw } from "lucide-react";

type SortAlgorithm = 'bubble' | 'selection' | 'insertion';

interface BarState {
    value: number;
    state: 'default' | 'comparing' | 'swapping' | 'sorted';
}

function generateBars(count: number): BarState[] {
    return Array.from({ length: count }, () => ({
        value: Math.floor(Math.random() * 90) + 10,
        state: 'default' as const,
    }));
}

const STATE_COLORS: Record<string, string> = {
    default: 'bg-neutral-500/60',
    comparing: 'bg-amber-400',
    swapping: 'bg-rose-500',
    sorted: 'bg-emerald-500',
};

export function SortingAlgoSim() {
    const [algo, setAlgo] = useState<SortAlgorithm>('bubble');
    const [barCount, setBarCount] = useState(20);
    const [speed, setSpeed] = useState(50);
    const [bars, setBars] = useState<BarState[]>(() => generateBars(20));
    const [running, setRunning] = useState(false);
    const [step, setStep] = useState(0);
    const runningRef = useRef(false);

    const reset = useCallback(() => {
        setRunning(false);
        runningRef.current = false;
        setBars(generateBars(barCount));
        setStep(0);
    }, [barCount]);

    useEffect(() => { reset(); }, [barCount]);

    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

    const runBubbleSort = useCallback(async () => {
        const arr = bars.map(b => ({ ...b }));
        runningRef.current = true;
        setRunning(true);
        let s = 0;

        for (let i = 0; i < arr.length - 1 && runningRef.current; i++) {
            for (let j = 0; j < arr.length - i - 1 && runningRef.current; j++) {
                arr[j].state = 'comparing';
                arr[j + 1].state = 'comparing';
                setBars([...arr]);
                await delay(200 - speed * 1.8);

                if (arr[j].value > arr[j + 1].value) {
                    arr[j].state = 'swapping';
                    arr[j + 1].state = 'swapping';
                    setBars([...arr]);
                    await delay(100 - speed * 0.9);
                    [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
                }

                arr[j].state = 'default';
                arr[j + 1].state = 'default';
                s++;
                setStep(s);
            }
            arr[arr.length - 1 - i].state = 'sorted';
            setBars([...arr]);
        }

        arr.forEach(b => b.state = 'sorted');
        setBars([...arr]);
        setRunning(false);
        runningRef.current = false;
    }, [bars, speed]);

    const runSelectionSort = useCallback(async () => {
        const arr = bars.map(b => ({ ...b }));
        runningRef.current = true;
        setRunning(true);
        let s = 0;

        for (let i = 0; i < arr.length - 1 && runningRef.current; i++) {
            let minIdx = i;
            arr[i].state = 'comparing';
            setBars([...arr]);

            for (let j = i + 1; j < arr.length && runningRef.current; j++) {
                arr[j].state = 'comparing';
                setBars([...arr]);
                await delay(150 - speed * 1.3);

                if (arr[j].value < arr[minIdx].value) {
                    if (minIdx !== i) arr[minIdx].state = 'default';
                    minIdx = j;
                } else {
                    arr[j].state = 'default';
                }
                s++;
                setStep(s);
            }

            if (minIdx !== i) {
                arr[i].state = 'swapping';
                arr[minIdx].state = 'swapping';
                setBars([...arr]);
                await delay(100 - speed * 0.9);
                [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
            }

            arr[i].state = 'sorted';
            setBars([...arr]);
        }

        arr.forEach(b => b.state = 'sorted');
        setBars([...arr]);
        setRunning(false);
        runningRef.current = false;
    }, [bars, speed]);

    const runInsertionSort = useCallback(async () => {
        const arr = bars.map(b => ({ ...b }));
        runningRef.current = true;
        setRunning(true);
        let s = 0;
        arr[0].state = 'sorted';
        setBars([...arr]);

        for (let i = 1; i < arr.length && runningRef.current; i++) {
            const key = { ...arr[i] };
            arr[i].state = 'comparing';
            setBars([...arr]);
            await delay(150 - speed * 1.3);

            let j = i - 1;
            while (j >= 0 && arr[j].value > key.value && runningRef.current) {
                arr[j].state = 'swapping';
                setBars([...arr]);
                await delay(100 - speed * 0.9);
                arr[j + 1] = { ...arr[j] };
                arr[j].state = 'sorted';
                j--;
                s++;
                setStep(s);
                setBars([...arr]);
            }

            arr[j + 1] = { ...key, state: 'sorted' };
            setBars([...arr]);
        }

        arr.forEach(b => b.state = 'sorted');
        setBars([...arr]);
        setRunning(false);
        runningRef.current = false;
    }, [bars, speed]);

    const startSort = useCallback(() => {
        if (algo === 'bubble') runBubbleSort();
        else if (algo === 'selection') runSelectionSort();
        else runInsertionSort();
    }, [algo, runBubbleSort, runSelectionSort, runInsertionSort]);

    const stopSort = useCallback(() => {
        runningRef.current = false;
        setRunning(false);
    }, []);

    const controls: ControlConfig[] = [
        {
            type: 'select', label: 'Algorithm', key: 'algo', value: algo, options: [
                { value: 'bubble', label: 'Bubble Sort' },
                { value: 'selection', label: 'Selection Sort' },
                { value: 'insertion', label: 'Insertion Sort' },
            ]
        },
        {
            type: 'select', label: 'Bar Count', key: 'barCount', value: String(barCount), options: [
                { value: '10', label: '10 bars' },
                { value: '20', label: '20 bars' },
                { value: '30', label: '30 bars' },
                { value: '50', label: '50 bars' },
            ]
        },
        { type: 'slider', label: 'Speed', key: 'speed', min: 10, max: 100, step: 5, value: speed },
    ];

    return (
        <div className="space-y-3">
            <div className="relative w-full h-52 bg-black/40 rounded-xl border border-white/[0.06] overflow-hidden flex items-end gap-[1px] p-3">
                {bars.map((bar, i) => (
                    <div
                        key={i}
                        className={cn("flex-1 rounded-t-sm transition-all duration-75", STATE_COLORS[bar.state])}
                        style={{ height: `${bar.value}%` }}
                    />
                ))}
                <div className="absolute top-2 left-3 text-[10px] text-muted-foreground">
                    Steps: {step}
                </div>
            </div>

            <div className="flex gap-2">
                {!running ? (
                    <Button onClick={startSort} className="flex-1 bg-white hover:bg-neutral-200 text-black text-xs h-8">
                        <Play className="w-3.5 h-3.5 mr-1.5" /> Start
                    </Button>
                ) : (
                    <Button onClick={stopSort} className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white text-xs h-8">
                        <Pause className="w-3.5 h-3.5 mr-1.5" /> Pause
                    </Button>
                )}
                <Button onClick={reset} variant="ghost" className="text-xs text-white/40 hover:text-white h-8" disabled={running}>
                    Reset
                </Button>
            </div>

            <SimulationControls
                controls={controls}
                onChange={(key, val) => {
                    if (running) return;
                    if (key === 'algo') { setAlgo(val); reset(); }
                    else if (key === 'barCount') { setBarCount(Number(val)); }
                    else if (key === 'speed') setSpeed(val);
                }}
                equation={{
                    label: algo === 'bubble' ? 'Bubble Sort' : algo === 'selection' ? 'Selection Sort' : 'Insertion Sort',
                    formula: algo === 'bubble' ? 'O(n²) worst case' : algo === 'selection' ? 'O(n²) all cases' : 'O(n²) worst, O(n) best',
                }}
            />

            <div className="flex gap-3 text-[10px] px-2 flex-wrap">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-neutral-500/60 inline-block rounded-sm" /> Unsorted</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-amber-400 inline-block rounded-sm" /> Comparing</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-rose-500 inline-block rounded-sm" /> Swapping</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-emerald-500 inline-block rounded-sm" /> Sorted</span>
            </div>
        </div>
    );
}
