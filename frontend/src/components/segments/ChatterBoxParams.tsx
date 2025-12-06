import { ArrowPathIcon, QuestionMarkCircleIcon } from "@heroicons/react/20/solid";
import { cn } from "../../lib/styles";

interface ChatterBoxParamsProps {
  temperature: number;
  exaggeration: number;
  cfgWeight: number;
  speedFactor: number;
  onTemperatureChange: (value: number) => void;
  onExaggerationChange: (value: number) => void;
  onCfgWeightChange: (value: number) => void;
  onSpeedFactorChange: (value: number) => void;
  disabled?: boolean;
}

interface SliderProps {
  label: string;
  tooltip: string;
  value: number;
  defaultValue: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  disabled?: boolean;
}

function Slider({ label, tooltip, value, defaultValue, onChange, min, max, step, disabled }: SliderProps) {
  const isDefault = Math.abs(value - defaultValue) < 0.001;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
          <div className="relative group">
            <QuestionMarkCircleIcon className="w-4 h-4 text-gray-400 dark:text-gray-500 cursor-help" />
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-56 z-50">
              {tooltip}
              <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-900 dark:border-t-gray-700" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isDefault && !disabled && (
            <button
              type="button"
              onClick={() => onChange(defaultValue)}
              className="p-0.5 text-gray-400 hover:text-purple-600 dark:hover:text-indigo-400 transition-colors"
              title={`Reset to default (${defaultValue})`}
            >
              <ArrowPathIcon className="w-3.5 h-3.5" />
            </button>
          )}
          <span className="text-sm font-mono text-gray-600 dark:text-gray-400">{value.toFixed(2)}</span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        disabled={disabled}
        className={cn(
          "w-full h-2 rounded-full appearance-none cursor-pointer",
          "bg-gray-300 dark:bg-white/10",
          "[&::-webkit-slider-thumb]:appearance-none",
          "[&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4",
          "[&::-webkit-slider-thumb]:rounded-full",
          "[&::-webkit-slider-thumb]:bg-purple-600 dark:[&::-webkit-slider-thumb]:bg-indigo-400",
          "[&::-webkit-slider-thumb]:cursor-pointer",
          "[&::-webkit-slider-thumb]:transition-transform",
          "[&::-webkit-slider-thumb]:hover:scale-110",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      />
    </div>
  );
}

export function ChatterBoxParams({
  temperature,
  exaggeration,
  cfgWeight,
  speedFactor,
  onTemperatureChange,
  onExaggerationChange,
  onCfgWeightChange,
  onSpeedFactorChange,
  disabled,
}: ChatterBoxParamsProps) {
  return (
    <div className="space-y-4">
      <Slider
        label="Temperature"
        tooltip="Affects the speed and randomness of the generated speech. Higher values produce more varied output."
        value={temperature}
        defaultValue={0.8}
        onChange={onTemperatureChange}
        min={0}
        max={1.5}
        step={0.05}
        disabled={disabled}
      />
      <Slider
        label="Exaggeration"
        tooltip="Controls the emotional intensity or expressiveness of the generated speech. Higher values increase emotional emphasis."
        value={exaggeration}
        defaultValue={0.8}
        onChange={onExaggerationChange}
        min={0}
        max={2.0}
        step={0.05}
        disabled={disabled}
      />
      <Slider
        label="CFG Weight"
        tooltip="Influences how closely the speech adheres to the reference voice. Lower values = more creative, higher values = closer to reference."
        value={cfgWeight}
        defaultValue={0.5}
        onChange={onCfgWeightChange}
        min={0}
        max={2.0}
        step={0.05}
        disabled={disabled}
      />
      <Slider
        label="Speed Factor"
        tooltip="Controls how quickly the AI delivers words per second in the generated audio. Experimental feature, may cause echo at extreme values."
        value={speedFactor}
        defaultValue={1.0}
        onChange={onSpeedFactorChange}
        min={0.25}
        max={4.0}
        step={0.05}
        disabled={disabled}
      />
    </div>
  );
}
