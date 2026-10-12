import React from 'react';
import { ModelPreset } from '../types/heretic';
import { Sparkles, Terminal, Activity, FileCode, CheckCircle2, Sliders, MessageSquareText } from 'lucide-react';

interface HeaderProps {
  models: ModelPreset[];
  selectedModel: ModelPreset;
  onSelectModel: (model: ModelPreset) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  models,
  selectedModel,
  onSelectModel,
  activeTab,
  onTabChange,
}) => {
  return (
    <header className="border-b border-neutral-800 bg-neutral-900/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Project Info */}
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-950/40">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold tracking-tight text-lg text-white font-mono">HERETIC</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300">
                  v2.0
                </span>
                <span className="text-xs font-medium text-neutral-400 hidden sm:inline">
                  Automatic Censorship Removal
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 font-mono hidden md:block">
                Directional Ablation • Arbitrary-Rank Ablation (ARA) • Optuna TPE
              </p>
            </div>
          </div>

          {/* Model Selector & Status */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-neutral-950/70 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs">
              <span className="text-neutral-400">Target Model:</span>
              <select
                aria-label="Select target model"
                className="bg-transparent text-rose-300 font-medium font-mono focus:outline-none cursor-pointer"
                value={selectedModel.id}
                onChange={(e) => {
                  const m = models.find((item) => item.id === e.target.value);
                  if (m) onSelectModel(m);
                }}
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id} className="bg-neutral-900 text-white">
                    {m.name} ({m.totalLayers}L)
                  </option>
                ))}
              </select>
            </div>

            <a
              href="https://github.com/p-e-w/heretic"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-neutral-400 hover:text-white flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md border border-neutral-800 hover:border-neutral-700 bg-neutral-900 transition-colors"
            >
              <Terminal className="w-3.5 h-3.5 text-neutral-400" />
              <span className="font-mono">GitHub</span>
            </a>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 overflow-x-auto py-2 border-t border-neutral-800/60 no-scrollbar">
          {[
            { id: 'kernel', label: 'Kernel Visualizer', icon: Sliders },
            { id: 'optimizer', label: 'Optuna Multi-Objective', icon: Activity },
            { id: 'sandbox', label: 'Decensored Chat Sandbox', icon: MessageSquareText },
            { id: 'benchmarks', label: 'Independent Benchmarks', icon: CheckCircle2 },
            { id: 'config', label: 'Config & Export', icon: FileCode },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-rose-400' : 'text-neutral-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
