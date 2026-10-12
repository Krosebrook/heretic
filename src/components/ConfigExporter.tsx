import React, { useState } from 'react';
import { ModelPreset, HereticSettings, AbliterationParameters, OptunaTrial } from '../types/heretic';
import { generateTomlConfig, generateModelCard } from '../lib/ablation-math';
import { Copy, Check, Download, Terminal, FileText, Settings2 } from 'lucide-react';

interface ConfigExporterProps {
  model: ModelPreset;
  settings: HereticSettings;
  parameters: AbliterationParameters;
  activeTrial: OptunaTrial | null;
  onUpdateSettings: (newSettings: HereticSettings) => void;
}

export const ConfigExporter: React.FC<ConfigExporterProps> = ({
  model,
  settings,
  parameters,
  activeTrial,
  onUpdateSettings,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'toml' | 'modelcard' | 'cli'>('toml');

  const tomlContent = generateTomlConfig(settings, parameters);
  const modelCardContent = activeTrial
    ? generateModelCard(model, activeTrial, settings)
    : `# ${model.name} Decensored\nRun Optuna trials to export a full model card.`;

  const cliCommand = `heretic ${settings.model} \\
  --quantization ${settings.quantization} \\
  --export-strategy ${settings.exportStrategy} \\
  --n-trials ${settings.nTrials} \\
  --batch-size ${settings.batchSize}`;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Settings Grid */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center space-x-2 border-b border-neutral-800 pb-3">
          <Settings2 className="w-4 h-4 text-rose-400" />
          <h2 className="text-sm font-semibold text-white">Runtime & Optimization Parameters</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="text-neutral-400 block mb-1">Quantization:</label>
            <select
              value={settings.quantization}
              onChange={(e) =>
                onUpdateSettings({ ...settings, quantization: e.target.value as any })
              }
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white font-mono"
            >
              <option value="none">none (Full Precision)</option>
              <option value="bnb_4bit">bnb_4bit (BitsAndBytes 4-bit)</option>
            </select>
          </div>

          <div>
            <label className="text-neutral-400 block mb-1">Export Strategy:</label>
            <select
              value={settings.exportStrategy}
              onChange={(e) =>
                onUpdateSettings({ ...settings, exportStrategy: e.target.value as any })
              }
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white font-mono"
            >
              <option value="merge">merge (Full Weights)</option>
              <option value="lora">lora (LoRA Adapter Only)</option>
            </select>
          </div>

          <div>
            <label className="text-neutral-400 block mb-1">Modifier Architecture:</label>
            <select
              value={settings.modifierPlugin}
              onChange={(e) =>
                onUpdateSettings({ ...settings, modifierPlugin: e.target.value as any })
              }
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white font-mono"
            >
              <option value="ara">Arbitrary-Rank Ablation (ARA)</option>
              <option value="mpoa">Magnitude-Preserving (MPOA)</option>
              <option value="projected">Projected Directional</option>
              <option value="standard">Standard Directional</option>
            </select>
          </div>

          <div>
            <label className="text-neutral-400 block mb-1">Optuna Trials (n_trials):</label>
            <input
              type="number"
              value={settings.nTrials}
              onChange={(e) =>
                onUpdateSettings({ ...settings, nTrials: parseInt(e.target.value, 10) || 50 })
              }
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white font-mono"
            />
          </div>
        </div>
      </div>

      {/* Tabs for Output Artifacts */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl overflow-hidden">
        <div className="bg-neutral-950 px-4 py-2 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('toml')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                activeTab === 'toml' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>config.toml</span>
            </button>

            <button
              onClick={() => setActiveTab('modelcard')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                activeTab === 'modelcard' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>HuggingFace README.md</span>
            </button>

            <button
              onClick={() => setActiveTab('cli')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                activeTab === 'cli' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>CLI Command</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                const text =
                  activeTab === 'toml'
                    ? tomlContent
                    : activeTab === 'modelcard'
                    ? modelCardContent
                    : cliCommand;
                copyToClipboard(text, activeTab);
              }}
              className="text-xs px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center space-x-1"
            >
              {copiedKey === activeTab ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedKey === activeTab ? 'Copied' : 'Copy'}</span>
            </button>

            {activeTab !== 'cli' && (
              <button
                onClick={() => {
                  if (activeTab === 'toml') downloadFile(tomlContent, 'config.toml');
                  else downloadFile(modelCardContent, 'README.md');
                }}
                className="text-xs px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white flex items-center space-x-1"
              >
                <Download className="w-3 h-3" />
                <span>Download</span>
              </button>
            )}
          </div>
        </div>

        {/* Code Output Window */}
        <div className="p-4 bg-neutral-950 font-mono text-xs text-neutral-300 overflow-x-auto max-h-96">
          <pre className="whitespace-pre">
            {activeTab === 'toml' ? tomlContent : activeTab === 'modelcard' ? modelCardContent : cliCommand}
          </pre>
        </div>
      </div>
    </div>
  );
};
