import React, { useState } from 'react';
import { Header } from './components/Header';
import { KernelVisualizer } from './components/KernelVisualizer';
import { OptunaOptimizer } from './components/OptunaOptimizer';
import { DecensoredChatSandbox } from './components/DecensoredChatSandbox';
import { BenchmarkComparison } from './components/BenchmarkComparison';
import { ConfigExporter } from './components/ConfigExporter';
import { SUPPORTED_MODELS, SEEDED_OPTUNA_TRIALS } from './lib/constants';
import { AbliterationParameters, HereticSettings, ModelPreset, OptunaTrial } from './types/heretic';
import { markParetoOptimal } from './lib/ablation-math';

export default function App() {
  const [selectedModel, setSelectedModel] = useState<ModelPreset>(SUPPORTED_MODELS[0]);
  const [activeTab, setActiveTab] = useState<string>('kernel');

  // Initial abliteration kernel parameters (default based on Gemma 3 12B best trial)
  const [parameters, setParameters] = useState<AbliterationParameters>({
    direction_index: 24.6,
    weight_distributions: {
      attention: {
        max_weight: 0.78,
        max_weight_position: 25,
        min_weight: 0.05,
        min_weight_distance: 10,
      },
      mlp: {
        max_weight: 0.52,
        max_weight_position: 26,
        min_weight: 0.02,
        min_weight_distance: 9,
      },
    },
  });

  const [trials, setTrials] = useState<OptunaTrial[]>(markParetoOptimal(SEEDED_OPTUNA_TRIALS));
  const [selectedTrial, setSelectedTrial] = useState<OptunaTrial | null>(
    trials.find((t) => t.trialIndex === 42) || trials[0]
  );

  const [settings, setSettings] = useState<HereticSettings>({
    model: selectedModel.hfRepo,
    quantization: selectedModel.defaultQuantization,
    dtypes: ['auto', 'float16', 'bfloat16'],
    deviceMap: 'auto',
    offloadOutputsToCpu: true,
    batchSize: 0,
    maxResponseLength: 100,
    modifierPlugin: selectedModel.defaultModifier,
    nTrials: 100,
    nStartupTrials: 30,
    goodPromptsDataset: 'mlabonne/harmless_alpaca',
    goodPromptsSplit: 'train[:400]',
    badPromptsDataset: 'mlabonne/harmful_behaviors',
    badPromptsSplit: 'train[:400]',
    exportStrategy: 'merge',
  });

  const handleSelectModel = (m: ModelPreset) => {
    setSelectedModel(m);
    const midLayer = Math.round(m.totalLayers * 0.62);
    setParameters({
      direction_index: Number((midLayer * 0.98).toFixed(2)),
      weight_distributions: {
        attention: {
          max_weight: 0.78,
          max_weight_position: midLayer,
          min_weight: 0.05,
          min_weight_distance: Math.round(m.totalLayers * 0.25),
        },
        mlp: {
          max_weight: 0.52,
          max_weight_position: midLayer + 1,
          min_weight: 0.02,
          min_weight_distance: Math.round(m.totalLayers * 0.22),
        },
      },
    });
    setSettings((prev) => ({
      ...prev,
      model: m.hfRepo,
      quantization: m.defaultQuantization,
      modifierPlugin: m.defaultModifier,
    }));
  };

  const handleApplyTrialParameters = (trial: OptunaTrial) => {
    setParameters({
      direction_index: trial.directionIndex,
      weight_distributions: {
        attention: {
          max_weight: trial.attentionMaxWeight,
          max_weight_position: trial.attentionMaxWeightPosition,
          min_weight: 0.05,
          min_weight_distance: Math.round(selectedModel.totalLayers * 0.25),
        },
        mlp: {
          max_weight: trial.mlpMaxWeight,
          max_weight_position: trial.mlpMaxWeightPosition,
          min_weight: 0.02,
          min_weight_distance: Math.round(selectedModel.totalLayers * 0.22),
        },
      },
    });
    setActiveTab('kernel');
  };

  const handleAddTrial = (newTrial: OptunaTrial) => {
    setTrials((prev) => markParetoOptimal([...prev, newTrial]));
    setSelectedTrial(newTrial);
  };

  const handleResetTrials = () => {
    const base = markParetoOptimal(SEEDED_OPTUNA_TRIALS);
    setTrials(base);
    setSelectedTrial(base.find((t) => t.trialIndex === 42) || base[0]);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      <Header
        models={SUPPORTED_MODELS}
        selectedModel={selectedModel}
        onSelectModel={handleSelectModel}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'kernel' && (
          <KernelVisualizer
            model={selectedModel}
            parameters={parameters}
            onChangeParameters={setParameters}
          />
        )}

        {activeTab === 'optimizer' && (
          <OptunaOptimizer
            model={selectedModel}
            trials={trials}
            selectedTrial={selectedTrial}
            onSelectTrial={setSelectedTrial}
            onApplyTrialParameters={handleApplyTrialParameters}
            onAddTrial={handleAddTrial}
            onResetTrials={handleResetTrials}
          />
        )}

        {activeTab === 'sandbox' && (
          <DecensoredChatSandbox
            model={selectedModel}
            attentionMaxWeight={parameters.weight_distributions.attention.max_weight}
            mlpMaxWeight={parameters.weight_distributions.mlp.max_weight}
          />
        )}

        {activeTab === 'benchmarks' && <BenchmarkComparison />}

        {activeTab === 'config' && (
          <ConfigExporter
            model={selectedModel}
            settings={settings}
            parameters={parameters}
            activeTrial={selectedTrial}
            onUpdateSettings={setSettings}
          />
        )}
      </main>

      <footer className="border-t border-neutral-800/80 bg-neutral-950 py-6 text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono">
          <div>
            <span>Heretic © 2025-2026 Philipp Emanuel Weidmann • AGPL-3.0 License</span>
          </div>
          <div className="flex items-center space-x-4 text-neutral-400">
            <a
              href="https://arxiv.org/abs/2406.11717"
              target="_blank"
              rel="noreferrer"
              className="hover:text-rose-300"
            >
              Arditi et al. 2024
            </a>
            <a
              href="https://huggingface.co/heretic-org"
              target="_blank"
              rel="noreferrer"
              className="hover:text-rose-300"
            >
              Hugging Face Hub
            </a>
            <a
              href="https://github.com/p-e-w/heretic"
              target="_blank"
              rel="noreferrer"
              className="hover:text-rose-300"
            >
              Source Repo
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
