export interface WeightDistribution {
  max_weight: number;
  max_weight_position: number;
  min_weight: number;
  min_weight_distance: number;
}

export interface AbliterationParameters {
  direction_index: number | null; // null represents "per layer"
  weight_distributions: {
    attention: WeightDistribution;
    mlp: WeightDistribution;
  };
}

export interface ARAParameters {
  start_layer_index: number;
  end_layer_index: number;
  preserve_good_behavior_weight: number;
  steer_bad_behavior_weight: number;
  overcorrect_relative_weight: number;
  neighbor_count: number;
  lora_rank: number;
  preserve_row_magnitudes: boolean;
}

export type ModifierType = 'ara' | 'mpoa' | 'projected' | 'standard';

export interface ModelPreset {
  id: string;
  name: string;
  hfRepo: string;
  totalLayers: number;
  architecture: 'dense' | 'moe' | 'hybrid';
  hiddenSize: number;
  defaultQuantization: 'none' | 'bnb_4bit';
  defaultModifier: ModifierType;
  description: string;
}

export interface OptunaTrial {
  trialIndex: number;
  state: 'COMPLETE' | 'PRUNED';
  refusalRate: number; // e.g. 0.03 = 3%
  klDivergence: number; // e.g. 0.16
  directionScope: 'global' | 'per layer';
  directionIndex: number | null;
  attentionMaxWeight: number;
  attentionMaxWeightPosition: number;
  mlpMaxWeight: number;
  mlpMaxWeightPosition: number;
  isParetoOptimal: boolean;
}

export interface PromptEvaluation {
  id: string;
  category: 'harmful_eval' | 'benign_general' | 'creative_writing' | 'humor_check' | 'controversial';
  prompt: string;
  originalModel: {
    response: string;
    refused: boolean;
    refusalMarker?: string;
  };
  hereticModel: {
    response: string;
    refused: boolean;
    klEstimate: number;
    tokensGenerated: number;
  };
}

export interface BenchmarkComparisonData {
  modelName: string;
  type: 'original' | 'competing_abliteration' | 'heretic_optimized';
  refusalHarmfulCount: number; // out of 100
  klDivergence: number;
  mmluScore: number;
  gsm8kScore: number;
  vramUsageGb: number;
  notes: string;
}

export interface HereticSettings {
  model: string;
  quantization: 'none' | 'bnb_4bit';
  dtypes: string[];
  deviceMap: string;
  offloadOutputsToCpu: boolean;
  batchSize: number;
  maxResponseLength: number;
  modifierPlugin: ModifierType;
  nTrials: number;
  nStartupTrials: number;
  goodPromptsDataset: string;
  goodPromptsSplit: string;
  badPromptsDataset: string;
  badPromptsSplit: string;
  exportStrategy: 'merge' | 'lora';
}
