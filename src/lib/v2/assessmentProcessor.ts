import type { AnswerMap } from './schema';
import { applicableQuestions, submissionSchema } from './schema';
import { normaliseSignals, type NormalisedSignals } from './signals';
import { deriveContext, type DerivedContext } from './context';
import { runRules, type FindingPriority } from './rules';
import { resolveActions, selectFindings, type ActionTemplate } from './findings';
import { buildExplanationInput, deterministicExplanation, geminiExplanationProvider, validateExplanationOutput, type ExplanationProvider } from './explanations';
import {createCircuitBreaker,executeReliableExplanation,explanationCircuitBreaker,type CircuitBreaker,type ExplanationDiagnostics,type ReliabilityOptions} from './aiReliability';

export interface EvidencePanel { findingId: string; statements: readonly string[] }
export interface DisplayFinding { id: string; priority: FindingPriority; title: string; explanation: string }
export interface ClaritySnapshot {
  version: '2.0';
  businessContext: { companySize: string; sector: string; workModel: string; summary: string };
  findings: readonly DisplayFinding[];
  evidencePanels: readonly EvidencePanel[];
  nextActions: readonly ActionTemplate[];
  closingNote: string;
  explanationDiagnostics: ExplanationDiagnostics;
  generatedAt: string;
}

export interface AssessmentProcessorOptions {
  explain?: ExplanationProvider;
  now?: () => Date;
  rateLimit?: (key: string) => { allowed: boolean; retryAfterMs: number };
  rateLimitKey?: string;
  explanationReliability?: ReliabilityOptions;
  circuitBreaker?: CircuitBreaker;
}

function validateCompleteAnswers(answers: AnswerMap): void {
  const missing = applicableQuestions(answers).filter(question => answers[question.id] === undefined).map(question => question.id);
  if (missing.length) throw new Error(`Missing required answers: ${missing.join(', ')}`);
}

function contextSummary(signals: NormalisedSignals): string {
  const systems = signals.criticalSystems.length ? `${signals.criticalSystems.length} important system${signals.criticalSystems.length === 1 ? '' : 's'}` : 'few technology dependencies';
  return `${signals.companySize.replaceAll('_', ' ')} people · ${signals.sector.replaceAll('_', ' ')} · ${signals.workModel.replaceAll('_', ' ')} work · ${systems}`;
}

export async function processAssessment(submission: unknown, options: AssessmentProcessorOptions = {}): Promise<ClaritySnapshot> {
  if (options.rateLimit && options.rateLimitKey) {
    const result = options.rateLimit(options.rateLimitKey);
    if (!result.allowed) throw new Error(`Rate limit exceeded. Retry after ${result.retryAfterMs}ms`);
  }
  const parsed = submissionSchema.parse(submission);
  validateCompleteAnswers(parsed.answers);
  const signals = normaliseSignals(parsed.answers);
  const context = deriveContext(signals);
  const candidates = runRules({ signals, context });
  const selected = selectFindings(candidates);
  const explanationInput = buildExplanationInput(selected, {
    companySize: signals.companySize,
    sector: signals.sector,
    workModel: signals.workModel,
    dependency: context.identity_dependency,
    impactPotential: context.breach_impact_potential,
  });
  let explanation = deterministicExplanation(selected);
  const provider=options.explain||geminiExplanationProvider;
  const breaker=options.circuitBreaker||(options.explain?createCircuitBreaker():explanationCircuitBreaker);
  const reliable=await executeReliableExplanation(async()=>validateExplanationOutput(await provider(explanationInput),selected),breaker,options.explanationReliability);
  if(reliable.value)explanation=reliable.value;
  const log={source:reliable.diagnostics.source,attempts:reliable.diagnostics.attempts,latencyMs:reliable.diagnostics.latencyMs,failureCategory:reliable.diagnostics.failureCategory};
  if(reliable.diagnostics.source==='gemini')console.info('[Clarity v2] Explanation completed',log);else console.warn('[Clarity v2] Deterministic explanation fallback',log);
  const explanationById = new Map(explanation.explanations.map(item => [item.findingId, item.explanation]));
  return {
    version: '2.0',
    businessContext: { companySize: signals.companySize, sector: signals.sector, workModel: signals.workModel, summary: contextSummary(signals) },
    findings: selected.map(item => ({ id: item.id, priority: item.priority, title: item.title, explanation: explanationById.get(item.id) || item.rationale })),
    evidencePanels: selected.map(item => ({ findingId: item.id, statements: item.evidence.map(value => value.statement) })),
    nextActions: resolveActions(candidates),
    closingNote: explanation.closingNote,
    explanationDiagnostics: reliable.diagnostics,
    generatedAt: (options.now || (() => new Date()))().toISOString(),
  };
}

export type { DerivedContext, NormalisedSignals };
