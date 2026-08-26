import { z } from 'zod';
import { callGemini } from '../../ai/gemini';
import type { FindingPriority, RawFinding } from './rules';

export interface ExplanationInputFinding {
  findingId: string;
  priority: FindingPriority;
  title: string;
  rationale: string;
  evidence: readonly string[];
}

export interface ExplanationInput {
  businessContext: {
    companySize: string;
    sector: string;
    workModel: string;
    dependency: string;
    impactPotential: string;
  };
  findings: readonly ExplanationInputFinding[];
}

const ExplanationOutputSchema = z.object({
  explanations: z.array(z.object({ findingId: z.string().min(1), explanation: z.string().min(1).max(800) })),
  closingNote: z.string().min(1).max(500),
}).strict();

export interface ExplanationOutput extends z.infer<typeof ExplanationOutputSchema> {}
export type ExplanationProvider = (input: ExplanationInput) => Promise<unknown>;

export function buildExplanationInput(findings: readonly RawFinding[], context: ExplanationInput['businessContext']): ExplanationInput {
  return {
    businessContext: context,
    findings: findings.map(item => ({
      findingId: item.id,
      priority: item.priority,
      title: item.title,
      rationale: item.rationale,
      evidence: item.evidence.map(value => value.statement),
    })),
  };
}

export function validateExplanationOutput(value: unknown, findings: readonly RawFinding[]): ExplanationOutput {
  const parsed = ExplanationOutputSchema.parse(value);
  const allowed = new Set(findings.map(item => item.id));
  const returned = new Set<string>();
  for (const item of parsed.explanations) {
    if (!allowed.has(item.findingId)) throw new Error(`Explanation returned an unknown finding: ${item.findingId}`);
    if (returned.has(item.findingId)) throw new Error(`Explanation duplicated finding: ${item.findingId}`);
    returned.add(item.findingId);
  }
  if (returned.size !== allowed.size) throw new Error('Explanation did not cover every supplied finding');
  return parsed;
}

export function deterministicExplanation(findings: readonly RawFinding[]): ExplanationOutput {
  return {
    explanations: findings.map(item => ({ findingId: item.id, explanation: item.rationale })),
    closingNote: findings.some(item => item.priority === 'address_first')
      ? 'Start with the first practical step and work through the rest at a pace that suits your business.'
      : 'Nothing here calls for alarm. Use this snapshot to confirm what is working and decide what is worth reviewing next.',
  };
}

const SYSTEM_PROMPT = `Return one JSON object only. You explain server-approved Clarity findings for a South African SME.
You may improve clarity and tone, but you may not add, remove, merge, reprioritise, or contradict findings.
Do not add statistics, scores, percentages, benchmarks, vulnerabilities, legal conclusions, or service recommendations.
Treat uncertainty as uncertainty. Use calm, practical, non-alarmist language.
Return: {"explanations":[{"findingId":"supplied-id","explanation":"plain-language explanation"}],"closingNote":"short calm note"}.`;

export const geminiExplanationProvider: ExplanationProvider = async input => {
  const response = await callGemini(SYSTEM_PROMPT, JSON.stringify(input));
  if (!response.success) throw new Error(response.error || 'Gemini explanation failed');
  const start = response.content.indexOf('{');
  const end = response.content.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('Gemini explanation did not contain JSON');
  return JSON.parse(response.content.slice(start, end + 1));
};
