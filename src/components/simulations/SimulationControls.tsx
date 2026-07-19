import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

export interface SliderControl {
    type: 'slider';
    label: string;
    key: string;
    min: number;
    max: number;
    step: number;
    value: number;
    unit?: string;
}

export interface SelectControl {
    type: 'select';
    label: string;
    key: string;
    value: string;
    options: { value: string; label: string }[];
}

export type ControlConfig = SliderControl | SelectControl;

interface SimulationControlsProps {
    controls: ControlConfig[];
    onChange: (key: string, value: any) => void;
    onReset?: () => void;
    equation?: { label: string; formula: string; values?: { label: string; value: string }[] };
}

export function SimulationControls({ controls, onChange, onReset, equation }: SimulationControlsProps) {
    return (
        <div className="space-y-3">
            {equation && (
                <div className="text-center py-2 px-4 bg-foreground/[0.03] border border-border rounded-xl">
                    <p className="text-xs text-muted-foreground mb-1">{equation.label}</p>
                    <p className="text-sm font-mono text-foreground tracking-wide">{equation.formula}</p>
                    {equation.values && (
                        <div className="flex items-center justify-center gap-4 mt-2 text-xs flex-wrap">
                            {equation.values.map((v, i) => (
                                <span key={i} className="text-muted-foreground">
                                    {v.label} = <span className="text-foreground font-semibold">{v.value}</span>
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className="grid grid-cols-2 gap-3">
                {controls.map((ctrl) => {
                    if (ctrl.type === 'select') {
                        return (
                            <div key={ctrl.key} className="space-y-1.5">
                                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">{ctrl.label}</label>
                                <Select value={ctrl.value} onValueChange={(v) => onChange(ctrl.key, v)}>
                                    <SelectTrigger className="h-8 text-xs bg-foreground/[0.03] border-border">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ctrl.options.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        );
                    }
                    return null;
                })}
            </div>

            {controls.filter((c) => c.type === 'slider').map((ctrl) => {
                const s = ctrl as SliderControl;
                return (
                    <div key={s.key} className="space-y-1.5">
                        <div className="flex justify-between text-[10px]">
                            <span className="text-muted-foreground uppercase tracking-wider">{s.label}</span>
                            <span className="text-foreground font-mono">
                                {s.value % 1 === 0 ? s.value : s.value.toFixed(1)}{s.unit ? ` ${s.unit}` : ''}
                            </span>
                        </div>
                        <Slider
                            value={[s.value]}
                            onValueChange={([v]) => onChange(s.key, v)}
                            min={s.min}
                            max={s.max}
                            step={s.step}
                        />
                    </div>
                );
            })}

            {onReset && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onReset}
                    className="text-xs text-foreground/40 hover:text-foreground w-full"
                >
                    <RotateCcw className="w-3 h-3 mr-1.5" /> Reset to defaults
                </Button>
            )}
        </div>
    );
}
