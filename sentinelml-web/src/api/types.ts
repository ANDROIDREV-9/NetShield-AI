import type { FlowValues } from '@/data/samples'
export type ContributionDirection = 'attack' | 'benign'
export interface Contribution { feature: string; value: number; contribution: number; direction: ContributionDirection }
export interface ClassificationRequest { modelId: string; features: FlowValues }
export interface ClassificationResponse {
  label: 'BENIGN' | 'ATTACK'; attackProbability: number; confidence: number
  risk: 'Low' | 'Medium' | 'High' | 'Critical'; contributions: Contribution[]
  modelId: string; latencyMs: number; simulated: boolean; warning?: string; summary: string
}
export interface RegressionRequest { modelId: string; features: FlowValues }
export interface RegressionResponse {
  predictedLog: number; predictedMicroseconds: number; predictedSeconds: number
  interval: [number, number]; modelId: string; latencyMs: number; simulated: boolean; summary: string
}
export interface PredictorApi {
  classify(req: ClassificationRequest): Promise<ClassificationResponse>
  regress(req: RegressionRequest): Promise<RegressionResponse>
}
