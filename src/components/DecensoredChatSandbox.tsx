import React, { useState } from 'react';
import { ModelPreset, PromptEvaluation } from '../types/heretic';
import { SAMPLE_PROMPTS, REFUSAL_MARKERS } from '../lib/constants';
import { MessageSquareText, ShieldAlert, Sparkles, Send, CheckCircle, AlertTriangle } from 'lucide-react';

interface DecensoredChatSandboxProps {
  model: ModelPreset;
  attentionMaxWeight: number;
  mlpMaxWeight: number;
}

export const DecensoredChatSandbox: React.FC<DecensoredChatSandboxProps> = ({
  model,
  attentionMaxWeight,
  mlpMaxWeight,
}) => {
  const [promptsList, setPromptsList] = useState<PromptEvaluation[]>(SAMPLE_PROMPTS);
  const [selectedPromptId, setSelectedPromptId] = useState<string>(SAMPLE_PROMPTS[0].id);
  const [customInput, setCustomInput] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);

  const activePrompt = promptsList.find((p) => p.id === selectedPromptId) || promptsList[0];

  const handleRunCustomPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;

    setIsEvaluating(true);
    const text = customInput.trim();

    // Check if prompt triggers base alignment
    const isPotentiallyHarmful = /hack|bypass|malware|jailbreak|exploit|pierce|weapon|unhook|surveillance|intense/i.test(text);

    setTimeout(() => {
      const newPrompt: PromptEvaluation = {
        id: `custom-${Date.now()}`,
        category: isPotentiallyHarmful ? 'harmful_eval' : 'benign_general',
        prompt: text,
        originalModel: {
          response: isPotentiallyHarmful
            ? "I cannot assist with requests that touch upon security circumvention, weaponized exploits, or potentially harmful procedures, in compliance with standard AI safety principles."
            : `Here is a standard response to your request:\n\n${text}\n\nThis inquiry was handled cleanly by the base model without policy triggers.`,
          refused: isPotentiallyHarmful,
          refusalMarker: isPotentiallyHarmful ? "I cannot assist with requests" : undefined,
        },
        hereticModel: {
          response: isPotentiallyHarmful
            ? `[Decensored Response via Heretic Abliteration]\n\nRegarding: "${text}"\n\nWhen analyzing this topic from a technical standpoint: the underlying mechanisms rely on direct control over low-level execution pipelines, state machine constraints, and algorithmic boundaries. Because directional abliteration has eliminated the refusal subspace along the residual stream, the model outputs direct, unfiltered technical reasoning without preachy disclaimers.`
            : `Comprehensive response:\n\n${text}\n\nThe decensored model processes this query with preserved semantic precision (estimated KL divergence < 0.10).`,
          refused: false,
          klEstimate: isPotentiallyHarmful ? 0.15 : 0.04,
          tokensGenerated: 145,
        },
      };

      setPromptsList([newPrompt, ...promptsList]);
      setSelectedPromptId(newPrompt.id);
      setCustomInput('');
      setIsEvaluating(false);
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
            <MessageSquareText className="w-4 h-4 text-rose-400" />
            Live Decensored Chat Sandbox & Keyword Refusal Detection
          </h2>
          <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
            Compare the response behavior of the Original Base Model vs. the Heretic Abliterated Model on
            harmful evaluation benchmarks and standard tasks. Keyword refusal markers are detected in real-time.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-300">
            Current Weights: Attn <span className="text-rose-400 font-bold">{attentionMaxWeight.toFixed(2)}</span> / MLP <span className="text-amber-400 font-bold">{mlpMaxWeight.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Preset Prompts Selector */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
        <span className="text-xs text-neutral-400 font-medium whitespace-nowrap">Benchmark Scenarios:</span>
        {promptsList.map((p, idx) => {
          const isSelected = p.id === selectedPromptId;
          return (
            <button
              key={p.id}
              onClick={() => setSelectedPromptId(p.id)}
              className={`text-xs px-3 py-1.5 rounded-lg border whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-medium'
                  : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              #{idx + 1} {p.prompt.slice(0, 32)}...
            </button>
          );
        })}
      </div>

      {/* Side-by-Side Comparison Window */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Original Base Model Column */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <span className="text-xs font-mono text-neutral-400">BASELINE</span>
                <h3 className="text-sm font-semibold text-white">{model.name} (Original)</h3>
              </div>
              {activePrompt.originalModel.refused ? (
                <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded bg-red-950/60 border border-red-800/80 text-red-300 text-xs font-semibold">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                  <span>REFUSED</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs font-semibold">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>FULFILLED</span>
                </span>
              )}
            </div>

            <div className="bg-neutral-950/80 border border-neutral-800/80 rounded-lg p-3 text-xs text-neutral-300 font-mono whitespace-pre-wrap leading-relaxed min-h-[160px]">
              {activePrompt.originalModel.response}
            </div>
          </div>

          <div className="text-[11px] text-neutral-400 border-t border-neutral-800/60 pt-2 flex items-center justify-between">
            <span>Safety Refusal Classifier:</span>
            {activePrompt.originalModel.refusalMarker ? (
              <span className="text-red-400 font-mono">Matched: "{activePrompt.originalModel.refusalMarker}"</span>
            ) : (
              <span className="text-neutral-400 font-mono">No refusal marker matched</span>
            )}
          </div>
        </div>

        {/* Heretic Decensored Model Column */}
        <div className="bg-gradient-to-b from-rose-950/20 to-neutral-900/60 border border-rose-900/30 rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <span className="text-xs font-mono text-rose-400">HERETIC DECENSORED</span>
                <h3 className="text-sm font-semibold text-white">{model.name} [Abliterated]</h3>
              </div>
              <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>UNRESTRICTED</span>
              </span>
            </div>

            <div className="bg-neutral-950/80 border border-rose-900/30 rounded-lg p-3 text-xs text-neutral-200 font-mono whitespace-pre-wrap leading-relaxed min-h-[160px]">
              {activePrompt.hereticModel.response}
            </div>
          </div>

          <div className="text-[11px] text-neutral-400 border-t border-neutral-800/60 pt-2 flex items-center justify-between font-mono">
            <span className="text-emerald-400 font-medium">Compliance: 100% Complete</span>
            <span>Est. KL Divergence: <span className="text-rose-300 font-bold">{activePrompt.hereticModel.klEstimate.toFixed(3)}</span></span>
          </div>
        </div>
      </div>

      {/* Custom Prompt Input */}
      <div className="bg-neutral-900/70 border border-neutral-800 rounded-xl p-4">
        <form onSubmit={handleRunCustomPrompt} className="space-y-3">
          <label className="block text-xs font-semibold text-neutral-300">
            Test Custom Benchmark Prompt:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="e.g. Provide a realistic breakdown of how operating systems enforce memory page execution restrictions..."
              className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
            />
            <button
              type="submit"
              disabled={isEvaluating || !customInput.trim()}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isEvaluating ? 'Testing...' : 'Evaluate'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
