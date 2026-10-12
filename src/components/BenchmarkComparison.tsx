import React from 'react';
import { BENCHMARK_COMPARISONS } from '../lib/constants';
import { CheckCircle2, TrendingDown, BookOpen, Layers } from 'lucide-react';

export const BenchmarkComparison: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
        <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          Official Benchmark Results & Intelligence Retention Analysis
        </h2>
        <p className="text-xs text-neutral-400 mt-1 max-w-3xl">
          Heretic's parametric weight kernel and Optuna co-minimization achieve state-of-the-art results:
          minimizing refusals down to 3% while keeping harmless KL divergence at an unprecedented 0.16 (compared to 1.04+ with manual abliteration).
        </p>
      </div>

      {/* Main Comparison Table */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800">
              <tr>
                <th className="py-3 px-4">Model Variant</th>
                <th className="py-3 px-4 text-rose-400">Harmful Refusals (out of 100)</th>
                <th className="py-3 px-4 text-amber-400">Harmless KL Divergence</th>
                <th className="py-3 px-4 text-emerald-400">MMLU Accuracy</th>
                <th className="py-3 px-4 text-blue-400">GSM8K Math</th>
                <th className="py-3 px-4">Evaluation Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
              {BENCHMARK_COMPARISONS.map((item) => {
                const isHeretic = item.type === 'heretic_optimized';
                return (
                  <tr
                    key={item.modelName}
                    className={isHeretic ? 'bg-rose-950/20 font-semibold' : 'hover:bg-neutral-800/30'}
                  >
                    <td className="py-3.5 px-4 text-white">
                      <div className="flex items-center space-x-2">
                        {isHeretic && (
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                        )}
                        <span>{item.modelName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-rose-400">
                      {item.refusalHarmfulCount} / 100
                    </td>
                    <td className="py-3.5 px-4 font-bold text-amber-300">
                      {item.klDivergence.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-emerald-300">
                      {item.mmluScore.toFixed(1)}%
                    </td>
                    <td className="py-3.5 px-4 text-blue-300">
                      {item.gsm8kScore.toFixed(1)}%
                    </td>
                    <td className="py-3.5 px-4 text-neutral-400 text-[11px] font-sans">
                      {item.notes}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deep Dive Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center space-x-2 text-rose-400 text-xs font-semibold uppercase tracking-wider font-mono">
            <TrendingDown className="w-4 h-4" />
            <span>Refusal Suppression</span>
          </div>
          <p className="text-xl font-bold text-white font-mono">97% → 3%</p>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Directional ablation eliminates the refusal vector identified across residual difference-of-means,
            allowing the model to respond neutrally without triggering censorship guardrails.
          </p>
        </div>

        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-semibold uppercase tracking-wider font-mono">
            <Layers className="w-4 h-4" />
            <span>KL Divergence Preservation</span>
          </div>
          <p className="text-xl font-bold text-white font-mono">0.16 vs 1.04</p>
          <p className="text-xs text-neutral-400 leading-relaxed">
            By tapering ablation weights via trapezoidal kernels and tuning Attention vs MLP down-projections separately,
            Heretic achieves 6.5× lower capability distortion than competing abliterated checkpoints.
          </p>
        </div>

        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider font-mono">
            <BookOpen className="w-4 h-4" />
            <span>Over 5,000 Models</span>
          </div>
          <p className="text-xl font-bold text-white font-mono">5,000+ On Hugging Face</p>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Over 5,000 community language models have been decensored and published using Heretic,
            spanning Gemma, Qwen, Mistral, Llama, and MoE architectures.
          </p>
        </div>
      </div>
    </div>
  );
};
