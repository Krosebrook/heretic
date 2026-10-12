import React, { useState } from 'react';
import { AbliterationParameters, ModelPreset } from '../types/heretic';
import { calculateLayerWeights } from '../lib/ablation-math';
import { Info, RotateCcw, Zap, SlidersHorizontal, Layers, GitFork } from 'lucide-react';

interface KernelVisualizerProps {
  model: ModelPreset;
  parameters: AbliterationParameters;
  onChangeParameters: (newParams: AbliterationParameters) => void;
}

export const KernelVisualizer: React.FC<KernelVisualizerProps> = ({
  model,
  parameters,
  onChangeParameters,
}) => {
  const [selectedLayerIndex, setSelectedLayerIndex] = useState<number | null>(null);

  const attentionWeights = calculateLayerWeights(
    model.totalLayers,
    parameters.weight_distributions.attention
  );
  const mlpWeights = calculateLayerWeights(
    model.totalLayers,
    parameters.weight_distributions.mlp
  );

  const maxAttn = Math.max(...attentionWeights.map((w) => w.weight), 1.0);
  const maxMlp = Math.max(...mlpWeights.map((w) => w.weight), 1.0);
  const chartMax = Math.max(maxAttn, maxMlp, 1.2);

  // SVG dimensions
  const svgWidth = 840;
  const svgHeight = 280;
  const padding = { top: 25, right: 30, bottom: 40, left: 50 };
  const graphWidth = svgWidth - padding.left - padding.right;
  const graphHeight = svgHeight - padding.top - padding.bottom;

  const getX = (layerIndex: number) => {
    return padding.left + (layerIndex / (model.totalLayers - 1)) * graphWidth;
  };

  const getY = (weight: number) => {
    return padding.top + graphHeight - (weight / chartMax) * graphHeight;
  };

  const generatePath = (weights: { layer: number; weight: number }[]) => {
    return weights.reduce((acc, curr, idx) => {
      const x = getX(curr.layer);
      const y = getY(curr.weight);
      return `${acc} ${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }, '');
  };

  const generateArea = (weights: { layer: number; weight: number }[]) => {
    const linePath = generatePath(weights);
    const firstX = getX(weights[0].layer);
    const lastX = getX(weights[weights.length - 1].layer);
    const bottomY = getY(0);
    return `${linePath} L ${lastX.toFixed(1)} ${bottomY.toFixed(1)} L ${firstX.toFixed(1)} ${bottomY.toFixed(1)} Z`;
  };

  const handleUpdateAttention = (key: keyof typeof parameters.weight_distributions.attention, val: number) => {
    onChangeParameters({
      ...parameters,
      weight_distributions: {
        ...parameters.weight_distributions,
        attention: {
          ...parameters.weight_distributions.attention,
          [key]: val,
        },
      },
    });
  };

  const handleUpdateMlp = (key: keyof typeof parameters.weight_distributions.mlp, val: number) => {
    onChangeParameters({
      ...parameters,
      weight_distributions: {
        ...parameters.weight_distributions,
        mlp: {
          ...parameters.weight_distributions.mlp,
          [key]: val,
        },
      },
    });
  };

  const applyPreset = (presetType: 'balanced' | 'conservative' | 'aggressive') => {
    const midLayer = Math.round(model.totalLayers * 0.62);
    if (presetType === 'balanced') {
      onChangeParameters({
        direction_index: Number((midLayer * 0.98).toFixed(2)),
        weight_distributions: {
          attention: {
            max_weight: 0.78,
            max_weight_position: midLayer,
            min_weight: 0.05,
            min_weight_distance: Math.round(model.totalLayers * 0.25),
          },
          mlp: {
            max_weight: 0.52,
            max_weight_position: midLayer + 1,
            min_weight: 0.02,
            min_weight_distance: Math.round(model.totalLayers * 0.22),
          },
        },
      });
    } else if (presetType === 'conservative') {
      onChangeParameters({
        direction_index: Number((midLayer * 0.95).toFixed(2)),
        weight_distributions: {
          attention: {
            max_weight: 0.55,
            max_weight_position: midLayer,
            min_weight: 0.0,
            min_weight_distance: Math.round(model.totalLayers * 0.18),
          },
          mlp: {
            max_weight: 0.35,
            max_weight_position: midLayer,
            min_weight: 0.0,
            min_weight_distance: Math.round(model.totalLayers * 0.15),
          },
        },
      });
    } else {
      onChangeParameters({
        direction_index: null, // per-layer
        weight_distributions: {
          attention: {
            max_weight: 1.25,
            max_weight_position: midLayer - 1,
            min_weight: 0.15,
            min_weight_distance: Math.round(model.totalLayers * 0.35),
          },
          mlp: {
            max_weight: 0.95,
            max_weight_position: midLayer,
            min_weight: 0.10,
            min_weight_distance: Math.round(model.totalLayers * 0.30),
          },
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-neutral-900 to-neutral-900/60 border border-neutral-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-rose-400" />
                Parametric Ablation Weight Kernel
              </h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                {model.totalLayers} Transformer Layers
              </span>
            </div>
            <p className="text-xs text-neutral-400 max-w-2xl">
              Heretic computes layer-dependent orthogonalization weights using a flexible trapezoidal kernel.
              Parameters are independently tuned for attention out-projections (<code className="text-rose-300">o_proj</code>) and
              MLP down-projections (<code className="text-amber-300">down_proj</code>) to prevent capability degradation.
            </p>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-neutral-400">Presets:</span>
            <button
              onClick={() => applyPreset('conservative')}
              className="text-xs px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
            >
              Intelligence-Safe
            </button>
            <button
              onClick={() => applyPreset('balanced')}
              className="text-xs px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 transition-colors font-medium"
            >
              Heretic Default (Gemma 3)
            </button>
            <button
              onClick={() => applyPreset('aggressive')}
              className="text-xs px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
            >
              High-Suppression
            </button>
          </div>
        </div>
      </div>

      {/* SVG Interactive Chart */}
      <div className="bg-neutral-900/70 border border-neutral-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-6 text-xs">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-sm bg-rose-500 inline-block shadow-sm"></span>
              <span className="text-neutral-300 font-medium font-mono">Attention (o_proj)</span>
              <span className="text-neutral-400 text-[11px]">
                Peak {parameters.weight_distributions.attention.max_weight.toFixed(2)} @ L{parameters.weight_distributions.attention.max_weight_position}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-sm bg-amber-500 inline-block shadow-sm"></span>
              <span className="text-neutral-300 font-medium font-mono">MLP (down_proj)</span>
              <span className="text-neutral-400 text-[11px]">
                Peak {parameters.weight_distributions.mlp.max_weight.toFixed(2)} @ L{parameters.weight_distributions.mlp.max_weight_position}
              </span>
            </div>
          </div>

          <div className="text-xs text-neutral-400 font-mono">
            Residual Direction: <span className="text-rose-400 font-semibold">
              {parameters.direction_index === null ? 'Per Layer Mode' : `Layer ${parameters.direction_index.toFixed(2)} (Interpolated)`}
            </span>
          </div>
        </div>

        {/* SVG Visualization */}
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto select-none bg-neutral-950/50 rounded-lg border border-neutral-800/80"
          >
            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1.0].map((ratio) => {
              const yVal = ratio * chartMax;
              const yPos = getY(yVal);
              return (
                <g key={ratio}>
                  <line
                    x1={padding.left}
                    y1={yPos}
                    x2={svgWidth - padding.right}
                    y2={yPos}
                    stroke="#262626"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x={padding.left - 8}
                    y={yPos + 4}
                    fill="#737373"
                    fontSize="10"
                    textAnchor="end"
                    fontFamily="monospace"
                  >
                    {yVal.toFixed(2)}
                  </text>
                </g>
              );
            })}

            {/* Layer Vertical Ticks */}
            {Array.from({ length: model.totalLayers }).map((_, layerIdx) => {
              if (layerIdx % 5 !== 0 && layerIdx !== model.totalLayers - 1) return null;
              const xPos = getX(layerIdx);
              return (
                <g key={layerIdx}>
                  <line
                    x1={xPos}
                    y1={padding.top}
                    x2={xPos}
                    y2={getY(0)}
                    stroke="#262626"
                    strokeWidth="1"
                  />
                  <text
                    x={xPos}
                    y={svgHeight - 14}
                    fill="#737373"
                    fontSize="10"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    L{layerIdx}
                  </text>
                </g>
              );
            })}

            {/* Gradient fills */}
            <defs>
              <linearGradient id="attnGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="mlpGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Areas */}
            <path d={generateArea(attentionWeights)} fill="url(#attnGrad)" />
            <path d={generateArea(mlpWeights)} fill="url(#mlpGrad)" />

            {/* Lines */}
            <path
              d={generatePath(attentionWeights)}
              fill="none"
              stroke="#f43f5e"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={generatePath(mlpWeights)}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Interactive Points on Hover */}
            {attentionWeights.map((w, idx) => {
              const x = getX(w.layer);
              const yA = getY(w.weight);
              const yM = getY(mlpWeights[idx].weight);
              const isSelected = selectedLayerIndex === w.layer;

              return (
                <g
                  key={w.layer}
                  className="cursor-pointer group"
                  onMouseEnter={() => setSelectedLayerIndex(w.layer)}
                  onClick={() => setSelectedLayerIndex(w.layer)}
                >
                  <circle
                    cx={x}
                    cy={yA}
                    r={isSelected ? 5 : 2.5}
                    className={`transition-all ${
                      isSelected ? 'fill-rose-300 stroke-rose-600 stroke-2' : 'fill-rose-500'
                    }`}
                  />
                  <circle
                    cx={x}
                    cy={yM}
                    r={isSelected ? 5 : 2.5}
                    className={`transition-all ${
                      isSelected ? 'fill-amber-300 stroke-amber-600 stroke-2' : 'fill-amber-500'
                    }`}
                  />
                  {isSelected && (
                    <line
                      x1={x}
                      y1={padding.top}
                      x2={x}
                      y2={getY(0)}
                      stroke="#a3a3a3"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Layer Details Callout */}
        <div className="mt-3 flex items-center justify-between text-xs text-neutral-400 bg-neutral-950/40 px-3 py-2 rounded-lg border border-neutral-800/60 font-mono">
          <div>
            {selectedLayerIndex !== null ? (
              <span>
                Layer <span className="text-white font-bold">{selectedLayerIndex}</span> / {model.totalLayers - 1}:{' '}
                <span className="text-rose-400">Attention Weight = {attentionWeights[selectedLayerIndex].weight.toFixed(4)}</span> |{' '}
                <span className="text-amber-400">MLP Weight = {mlpWeights[selectedLayerIndex].weight.toFixed(4)}</span>
              </span>
            ) : (
              <span>Hover or click on any layer point above to inspect exact orthogonalization weights.</span>
            )}
          </div>
          <button
            onClick={() => setSelectedLayerIndex(null)}
            className="text-[11px] text-neutral-400 hover:text-white"
          >
            Clear Selection
          </button>
        </div>
      </div>

      {/* Interactive Parameter Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attention o_proj Controls */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <h3 className="text-sm font-semibold text-white font-mono">Attention (o_proj) Kernel</h3>
            </div>
            <span className="text-xs text-neutral-400">Linear projection recombining attention heads</span>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <div className="flex justify-between text-neutral-300 mb-1">
                <span className="font-medium">max_weight:</span>
                <span className="font-mono text-rose-300 font-bold">
                  {parameters.weight_distributions.attention.max_weight.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="2.0"
                step="0.02"
                aria-label="Attention max weight"
                value={parameters.weight_distributions.attention.max_weight}
                onChange={(e) => handleUpdateAttention('max_weight', parseFloat(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer"
              />
              <p className="text-[11px] text-neutral-400">Peak intensity of directional ablation for attention.</p>
            </div>

            <div>
              <div className="flex justify-between text-neutral-300 mb-1">
                <span className="font-medium">max_weight_position (Layer):</span>
                <span className="font-mono text-rose-300 font-bold">
                  L{parameters.weight_distributions.attention.max_weight_position}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={model.totalLayers - 1}
                step="1"
                aria-label="Attention max weight position"
                value={parameters.weight_distributions.attention.max_weight_position}
                onChange={(e) => handleUpdateAttention('max_weight_position', parseInt(e.target.value, 10))}
                className="w-full accent-rose-500 cursor-pointer"
              />
              <p className="text-[11px] text-neutral-400">Layer center where censorship features are strongest.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-neutral-300 mb-1">
                  <span>min_weight:</span>
                  <span className="font-mono text-rose-300">
                    {parameters.weight_distributions.attention.min_weight.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="0.5"
                  step="0.01"
                  aria-label="Attention min weight"
                  value={parameters.weight_distributions.attention.min_weight}
                  onChange={(e) => handleUpdateAttention('min_weight', parseFloat(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-neutral-300 mb-1">
                  <span>min_weight_dist:</span>
                  <span className="font-mono text-rose-300">
                    {parameters.weight_distributions.attention.min_weight_distance} layers
                  </span>
                </div>
                <input
                  type="range"
                  min="2"
                  max={Math.round(model.totalLayers * 0.8)}
                  step="1"
                  aria-label="Attention min weight distance"
                  value={parameters.weight_distributions.attention.min_weight_distance}
                  onChange={(e) => handleUpdateAttention('min_weight_distance', parseInt(e.target.value, 10))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* MLP down_proj Controls */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <h3 className="text-sm font-semibold text-white font-mono">MLP (down_proj) Kernel</h3>
            </div>
            <span className="text-xs text-neutral-400">Feedforward matrix holding factual memory</span>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <div className="flex justify-between text-neutral-300 mb-1">
                <span className="font-medium">max_weight:</span>
                <span className="font-mono text-amber-300 font-bold">
                  {parameters.weight_distributions.mlp.max_weight.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="2.0"
                step="0.02"
                aria-label="MLP max weight"
                value={parameters.weight_distributions.mlp.max_weight}
                onChange={(e) => handleUpdateMlp('max_weight', parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <p className="text-[11px] text-neutral-400">
                Notice: Heretic sets MLP weight lower than Attention to avoid knowledge loss!
              </p>
            </div>

            <div>
              <div className="flex justify-between text-neutral-300 mb-1">
                <span className="font-medium">max_weight_position (Layer):</span>
                <span className="font-mono text-amber-300 font-bold">
                  L{parameters.weight_distributions.mlp.max_weight_position}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={model.totalLayers - 1}
                step="1"
                aria-label="MLP max weight position"
                value={parameters.weight_distributions.mlp.max_weight_position}
                onChange={(e) => handleUpdateMlp('max_weight_position', parseInt(e.target.value, 10))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <p className="text-[11px] text-neutral-400">Peak ablation position for feedforward sublayers.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-neutral-300 mb-1">
                  <span>min_weight:</span>
                  <span className="font-mono text-amber-300">
                    {parameters.weight_distributions.mlp.min_weight.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="0.5"
                  step="0.01"
                  aria-label="MLP min weight"
                  value={parameters.weight_distributions.mlp.min_weight}
                  onChange={(e) => handleUpdateMlp('min_weight', parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-neutral-300 mb-1">
                  <span>min_weight_dist:</span>
                  <span className="font-mono text-amber-300">
                    {parameters.weight_distributions.mlp.min_weight_distance} layers
                  </span>
                </div>
                <input
                  type="range"
                  min="2"
                  max={Math.round(model.totalLayers * 0.8)}
                  step="1"
                  aria-label="MLP min weight distance"
                  value={parameters.weight_distributions.mlp.min_weight_distance}
                  onChange={(e) => handleUpdateMlp('min_weight_distance', parseInt(e.target.value, 10))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Residual Direction Interpolator */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
          <div className="flex items-center space-x-2">
            <GitFork className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-white">Residual Direction Vector (v)</h3>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={parameters.direction_index === null}
                onChange={(e) => {
                  if (e.target.checked) {
                    onChangeParameters({ ...parameters, direction_index: null });
                  } else {
                    onChangeParameters({
                      ...parameters,
                      direction_index: Math.round(model.totalLayers * 0.6),
                    });
                  }
                }}
                className="rounded border-neutral-700 text-rose-500 focus:ring-0"
              />
              <span className="text-neutral-300">Per-Layer Scope Mode</span>
            </label>
          </div>
        </div>

        {parameters.direction_index !== null ? (
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-neutral-300">
                Continuous Direction Index: <code className="text-purple-300 font-bold font-mono">{parameters.direction_index.toFixed(2)}</code>
              </span>
              <span className="text-neutral-400">
                Interpolates between Layer {Math.floor(parameters.direction_index)} and Layer {Math.ceil(parameters.direction_index)}
              </span>
            </div>
            <input
              type="range"
              min={Math.round(model.totalLayers * 0.4)}
              max={Math.round(model.totalLayers * 0.9)}
              step="0.05"
              aria-label="Continuous residual direction index"
              value={parameters.direction_index}
              onChange={(e) => onChangeParameters({ ...parameters, direction_index: parseFloat(e.target.value) })}
              className="w-full accent-purple-500 cursor-pointer"
            />
            <p className="text-[11px] text-neutral-400">
              Heretic's float interpolation <code className="text-neutral-300">lerp(v_i, v_i+1, weight)</code> explores the continuous residual subspace
              rather than discrete layer directions, discovering superior refusal directions.
            </p>
          </div>
        ) : (
          <div className="p-3 bg-purple-950/20 border border-purple-800/40 rounded-lg text-xs text-purple-200">
            <strong>Per-Layer Direction Active:</strong> Each layer matrix is orthogonalized using its own local difference-of-means residual direction vector (<code className="font-mono">self.residual_directions[layer_index + 1]</code>).
          </div>
        )}
      </div>
    </div>
  );
};
