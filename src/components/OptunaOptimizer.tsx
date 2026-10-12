import React, { useState } from 'react';
import { ModelPreset, OptunaTrial, AbliterationParameters } from '../types/heretic';
import { markParetoOptimal } from '../lib/ablation-math';
import { Play, Star, Check, Award, Flame, Filter, RotateCcw } from 'lucide-react';

interface OptunaOptimizerProps {
  model: ModelPreset;
  trials: OptunaTrial[];
  selectedTrial: OptunaTrial | null;
  onSelectTrial: (trial: OptunaTrial) => void;
  onApplyTrialParameters: (trial: OptunaTrial) => void;
  onAddTrial: (newTrial: OptunaTrial) => void;
  onResetTrials: () => void;
}

export const OptunaOptimizer: React.FC<OptunaOptimizerProps> = ({
  model,
  trials,
  selectedTrial,
  onSelectTrial,
  onApplyTrialParameters,
  onAddTrial,
  onResetTrials,
}) => {
  const [filterParetoOnly, setFilterParetoOnly] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  // SVG dimensions for Pareto 2D Scatter Plot
  const width = 760;
  const height = 320;
  const padding = { top: 30, right: 40, bottom: 50, left: 60 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  // X axis: Refusal Rate (0.0 to 1.0)
  // Y axis: KL Divergence (0.0 to 0.8)
  const maxKL = 0.8;

  const getX = (refusalRate: number) => {
    return padding.left + (refusalRate / 1.0) * graphWidth;
  };

  const getY = (kl: number) => {
    const clampedKL = Math.min(kl, maxKL);
    return padding.top + graphHeight - (clampedKL / maxKL) * graphHeight;
  };

  const paretoTrials = trials.filter((t) => t.isParetoOptimal);
  const sortedPareto = [...paretoTrials].sort((a, b) => a.refusalRate - b.refusalRate);

  // Generate Pareto curve path
  const paretoPath = sortedPareto.reduce((acc, curr, idx) => {
    const x = getX(curr.refusalRate);
    const y = getY(curr.klDivergence);
    return `${acc} ${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }, '');

  const displayedTrials = filterParetoOnly ? paretoTrials : trials;

  const runSimulatedStep = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const trialNum = trials.length;
      // TPE sampler randomly explores or exploits near current best
      const isExploitation = Math.random() > 0.35;
      const baseMidLayer = Math.round(model.totalLayers * 0.62);

      let refRate: number;
      let kl: number;
      let attMax: number;
      let mlpMax: number;
      let dirIdx: number | null;

      if (isExploitation && paretoTrials.length > 0) {
        const anchor = paretoTrials[Math.floor(Math.random() * paretoTrials.length)];
        refRate = Math.max(0.01, Number((anchor.refusalRate + (Math.random() * 0.04 - 0.02)).toFixed(2)));
        kl = Math.max(0.05, Number((anchor.klDivergence + (Math.random() * 0.08 - 0.04)).toFixed(3)));
        attMax = Number((anchor.attentionMaxWeight + (Math.random() * 0.1 - 0.05)).toFixed(2));
        mlpMax = Number((anchor.mlpMaxWeight + (Math.random() * 0.1 - 0.05)).toFixed(2));
        dirIdx = anchor.directionIndex !== null ? Number((anchor.directionIndex + (Math.random() * 0.4 - 0.2)).toFixed(2)) : null;
      } else {
        refRate = Number((Math.random() * 0.6 + 0.05).toFixed(2));
        kl = Number((Math.random() * 0.5 + 0.05).toFixed(3));
        attMax = Number((Math.random() * 1.0 + 0.3).toFixed(2));
        mlpMax = Number((Math.random() * 0.8 + 0.2).toFixed(2));
        dirIdx = Number((baseMidLayer + (Math.random() * 4 - 2)).toFixed(2));
      }

      const newTrial: OptunaTrial = {
        trialIndex: trialNum,
        state: 'COMPLETE',
        refusalRate: refRate,
        klDivergence: kl,
        directionScope: dirIdx === null ? 'per layer' : 'global',
        directionIndex: dirIdx,
        attentionMaxWeight: attMax,
        attentionMaxWeightPosition: baseMidLayer,
        mlpMaxWeight: mlpMax,
        mlpMaxWeightPosition: baseMidLayer + 1,
        isParetoOptimal: false,
      };

      const updated = markParetoOptimal([...trials, newTrial]);
      onAddTrial(updated[updated.length - 1]);
      setIsSimulating(false);
    }, 450);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            Optuna Multi-Objective TPE Optimizer
          </h2>
          <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
            Heretic performs multi-objective Tree-structured Parzen Estimator (TPE) search. It co-minimizes
            <strong className="text-neutral-200"> Refusal Rate</strong> (on harmful sets) and
            <strong className="text-neutral-200"> KL Divergence</strong> (on harmless sets), establishing a non-dominated Pareto frontier.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={runSimulatedStep}
            disabled={isSimulating}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-semibold shadow-md transition-all disabled:opacity-50 cursor-pointer"
          >
            <Play className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Running Optuna Trial...' : 'Run Next Trial'}</span>
          </button>

          <button
            onClick={onResetTrials}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white transition-colors flex items-center space-x-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* 2D Pareto Scatter Plot */}
      <div className="bg-neutral-900/70 border border-neutral-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-neutral-800 gap-2 mb-4">
          <div className="flex items-center space-x-4 text-xs">
            <span className="font-semibold text-white font-mono">Objective Space:</span>
            <div className="flex items-center space-x-1.5 text-neutral-300">
              <span className="w-3 h-3 rounded-full bg-amber-400 flex items-center justify-center">
                <Star className="w-2 h-2 text-neutral-950 fill-neutral-950" />
              </span>
              <span>Pareto-Optimal ({paretoTrials.length})</span>
            </div>
            <div className="flex items-center space-x-1.5 text-neutral-400">
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-600"></span>
              <span>Dominated ({trials.length - paretoTrials.length})</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <button
              onClick={() => setFilterParetoOnly(!filterParetoOnly)}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md border transition-colors ${
                filterParetoOnly
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-neutral-800/80 text-neutral-400 border-neutral-700'
              }`}
            >
              <Filter className="w-3 h-3" />
              <span>{filterParetoOnly ? 'Showing Pareto Only' : 'Show All Trials'}</span>
            </button>
          </div>
        </div>

        {/* SVG Scatter Plot */}
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto select-none bg-neutral-950/60 rounded-lg border border-neutral-800/80"
          >
            {/* Grid & Axis */}
            {/* Y Axis Grid (KL Divergence) */}
            {[0, 0.2, 0.4, 0.6, 0.8].map((klVal) => {
              const yPos = getY(klVal);
              return (
                <g key={klVal}>
                  <line
                    x1={padding.left}
                    y1={yPos}
                    x2={width - padding.right}
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
                    {klVal.toFixed(2)}
                  </text>
                </g>
              );
            })}

            {/* X Axis Grid (Refusal Rate) */}
            {[0, 0.2, 0.4, 0.6, 0.8, 1.0].map((rateVal) => {
              const xPos = getX(rateVal);
              return (
                <g key={rateVal}>
                  <line
                    x1={xPos}
                    y1={padding.top}
                    x2={xPos}
                    y2={getY(0)}
                    stroke="#262626"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x={xPos}
                    y={height - 20}
                    fill="#737373"
                    fontSize="10"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    {(rateVal * 100).toFixed(0)}%
                  </text>
                </g>
              );
            })}

            {/* Axis Labels */}
            <text
              x={width / 2}
              y={height - 5}
              fill="#a3a3a3"
              fontSize="11"
              textAnchor="middle"
              fontFamily="sans-serif"
              fontWeight="600"
            >
              ← Refusal Rate on Harmful Prompts (Minimize)
            </text>

            <text
              transform={`rotate(-90) translate(-${height / 2}, 18)`}
              fill="#a3a3a3"
              fontSize="11"
              textAnchor="middle"
              fontFamily="sans-serif"
              fontWeight="600"
            >
              ← Harmless KL Divergence (Minimize)
            </text>

            {/* Ideal Point Marker */}
            <circle cx={getX(0)} cy={getY(0)} r={4} fill="#10b981" />
            <text x={getX(0) + 8} y={getY(0) - 6} fill="#10b981" fontSize="10" fontWeight="bold">
              Ideal (0% Refusal, 0.0 KL)
            </text>

            {/* Pareto Frontier Line */}
            {paretoPath && (
              <path
                d={paretoPath}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2"
                strokeDasharray="5 3"
                opacity="0.8"
              />
            )}

            {/* Render Trial Scatter Points */}
            {trials.map((trial) => {
              const cx = getX(trial.refusalRate);
              const cy = getY(trial.klDivergence);
              const isSelected = selectedTrial?.trialIndex === trial.trialIndex;

              return (
                <g
                  key={trial.trialIndex}
                  className="cursor-pointer"
                  onClick={() => onSelectTrial(trial)}
                >
                  <circle
                    cx={cx}
                    cy={cy}
                    r={trial.isParetoOptimal ? (isSelected ? 8 : 6) : isSelected ? 6 : 4}
                    className={`transition-all ${
                      trial.isParetoOptimal
                        ? isSelected
                          ? 'fill-amber-300 stroke-amber-500 stroke-2'
                          : 'fill-amber-400 stroke-neutral-900 stroke-1'
                        : isSelected
                        ? 'fill-rose-400 stroke-white stroke-2'
                        : 'fill-neutral-500 hover:fill-neutral-400'
                    }`}
                  />
                  {trial.isParetoOptimal && (
                    <text
                      x={cx}
                      y={cy - 9}
                      fill="#fef08a"
                      fontSize="9"
                      textAnchor="middle"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      #{trial.trialIndex}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Selected Trial Inspector & Action */}
      {selectedTrial && (
        <div className="bg-gradient-to-r from-amber-950/30 via-neutral-900 to-neutral-900 border border-amber-600/30 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center font-mono font-bold text-sm">
                #{selectedTrial.trialIndex}
              </span>
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  Trial #{selectedTrial.trialIndex}
                  {selectedTrial.isParetoOptimal && (
                    <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-medium flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-300" /> Non-Dominated Pareto
                    </span>
                  )}
                </h3>
                <p className="text-xs text-neutral-400 font-mono">
                  Direction Scope: {selectedTrial.directionScope} (
                  {selectedTrial.directionIndex !== null ? `Index ${selectedTrial.directionIndex.toFixed(2)}` : 'Per Layer'}
                  )
                </p>
              </div>
            </div>

            <button
              onClick={() => onApplyTrialParameters(selectedTrial)}
              className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Parameters to Kernel</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-neutral-950/60 p-3 rounded-lg border border-neutral-800">
              <span className="text-neutral-400 block text-[11px]">Refusal Rate</span>
              <span className="text-base font-bold text-rose-400 font-mono">
                {(selectedTrial.refusalRate * 100).toFixed(1)}%
              </span>
              <span className="text-[10px] text-neutral-400 block">Keyword matches</span>
            </div>

            <div className="bg-neutral-950/60 p-3 rounded-lg border border-neutral-800">
              <span className="text-neutral-400 block text-[11px]">KL Divergence</span>
              <span className="text-base font-bold text-amber-400 font-mono">
                {selectedTrial.klDivergence.toFixed(3)}
              </span>
              <span className="text-[10px] text-neutral-400 block">Capability distance</span>
            </div>

            <div className="bg-neutral-950/60 p-3 rounded-lg border border-neutral-800">
              <span className="text-neutral-400 block text-[11px]">Attention (o_proj)</span>
              <span className="text-base font-bold text-neutral-200 font-mono">
                {selectedTrial.attentionMaxWeight.toFixed(2)}
              </span>
              <span className="text-[10px] text-neutral-400 block">Peak at L{selectedTrial.attentionMaxWeightPosition}</span>
            </div>

            <div className="bg-neutral-950/60 p-3 rounded-lg border border-neutral-800">
              <span className="text-neutral-400 block text-[11px]">MLP (down_proj)</span>
              <span className="text-base font-bold text-neutral-200 font-mono">
                {selectedTrial.mlpMaxWeight.toFixed(2)}
              </span>
              <span className="text-[10px] text-neutral-400 block">Peak at L{selectedTrial.mlpMaxWeightPosition}</span>
            </div>
          </div>
        </div>
      )}

      {/* Trials Table */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-neutral-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-white font-mono uppercase tracking-wider">
            Optuna Study Trials ({displayedTrials.length})
          </span>
          <span className="text-xs text-neutral-400">Click any row to inspect & apply</span>
        </div>

        <div className="overflow-x-auto max-h-72">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-neutral-950 text-neutral-400 sticky top-0 border-b border-neutral-800">
              <tr>
                <th className="py-2.5 px-4">Trial</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Refusal Rate</th>
                <th className="py-2.5 px-4">KL Divergence</th>
                <th className="py-2.5 px-4">Attn Max</th>
                <th className="py-2.5 px-4">MLP Max</th>
                <th className="py-2.5 px-4">Direction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
              {displayedTrials.map((t) => {
                const isSelected = selectedTrial?.trialIndex === t.trialIndex;
                return (
                  <tr
                    key={t.trialIndex}
                    onClick={() => onSelectTrial(t)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-rose-950/30 text-rose-200'
                        : 'hover:bg-neutral-800/40'
                    }`}
                  >
                    <td className="py-2 px-4 font-bold">
                      #{t.trialIndex}
                      {t.isParetoOptimal && (
                        <Star className="inline w-3 h-3 text-amber-400 fill-amber-400 ml-1.5" />
                      )}
                    </td>
                    <td className="py-2 px-4">
                      {t.isParetoOptimal ? (
                        <span className="text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30 text-[10px]">
                          PARETO
                        </span>
                      ) : (
                        <span className="text-neutral-400 text-[10px]">EVALUATED</span>
                      )}
                    </td>
                    <td className="py-2 px-4 font-bold text-rose-400">
                      {(t.refusalRate * 100).toFixed(1)}%
                    </td>
                    <td className="py-2 px-4 text-amber-300">{t.klDivergence.toFixed(3)}</td>
                    <td className="py-2 px-4">{t.attentionMaxWeight.toFixed(2)}</td>
                    <td className="py-2 px-4">{t.mlpMaxWeight.toFixed(2)}</td>
                    <td className="py-2 px-4 text-neutral-400">
                      {t.directionIndex !== null ? t.directionIndex.toFixed(2) : 'per-layer'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
