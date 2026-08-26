import type { AnswerMap } from './schema';

export type Knowledge<T extends string> = T | 'unknown';
export interface NormalisedSignals {
  companySize: string; sector: string; criticalSystems: readonly string[]; workModel: string; dataSensitivity: Knowledge<'high'|'medium'|'low'>;
  mfa: Knowledge<'full'|'partial'|'none'>; offboarding: Knowledge<'same_day'|'few_days'|'ad_hoc'>; accountSharing: Knowledge<'individual'|'some_shared'|'many_shared'>;
  endpointProtection: Knowledge<'yes'|'partial'|'no'>; patching: Knowledge<'automatic'|'manual'|'delayed'>;
  backups: Knowledge<'full'|'partial'|'none'>; restoreTest: Knowledge<'three_months'|'year'|'old'|'never'>|'not_applicable';
  training: Knowledge<'yes'|'partial'|'no'>; reporting: Knowledge<'clear'|'informal'|'none'>;
  monitoring: Knowledge<'monitored'|'unreviewed'|'none'>; incidentReadiness: Knowledge<'clear'|'informal'|'none'>; externalExposure: Knowledge<'known'|'mostly'|'not_known'>;
  securityOwner: Knowledge<'clear'|'shared'|'none'>; aiUsage: Knowledge<'regular'|'occasional'|'unaware'|'none'>; aiDataRules: Knowledge<'clear'|'informal'|'none'>|'not_applicable'; aiHumanReview: Knowledge<'always'|'usually'|'sometimes'|'rarely'>|'not_applicable';
}
const one = (answers: AnswerMap, id: string, fallback = 'unknown') => typeof answers[id] === 'string' ? answers[id] as string : fallback;
export function normaliseSignals(answers: AnswerMap): NormalisedSignals {
  const aiUsed = ['regular','occasional'].includes(one(answers, 'ai_usage'));
  const backupsPresent = ['full','partial'].includes(one(answers, 'backups'));
  return {
    companySize: one(answers,'company_size'), sector: one(answers,'sector'), criticalSystems: Array.isArray(answers.critical_systems) ? answers.critical_systems : [], workModel: one(answers,'work_model'), dataSensitivity: one(answers,'sensitive_data') as NormalisedSignals['dataSensitivity'],
    mfa: one(answers,'mfa') as NormalisedSignals['mfa'], offboarding: one(answers,'offboarding') as NormalisedSignals['offboarding'], accountSharing: one(answers,'account_sharing') as NormalisedSignals['accountSharing'], endpointProtection: one(answers,'endpoint_protection') as NormalisedSignals['endpointProtection'], patching: one(answers,'patching') as NormalisedSignals['patching'],
    backups: one(answers,'backups') as NormalisedSignals['backups'], restoreTest: (backupsPresent ? one(answers,'restore_test') : 'not_applicable') as NormalisedSignals['restoreTest'], training: one(answers,'training') as NormalisedSignals['training'], reporting: one(answers,'reporting') as NormalisedSignals['reporting'], monitoring: one(answers,'monitoring') as NormalisedSignals['monitoring'], incidentReadiness: one(answers,'incident_readiness') as NormalisedSignals['incidentReadiness'], externalExposure: one(answers,'external_exposure') as NormalisedSignals['externalExposure'], securityOwner: one(answers,'security_owner') as NormalisedSignals['securityOwner'], aiUsage: one(answers,'ai_usage') as NormalisedSignals['aiUsage'], aiDataRules: (aiUsed ? one(answers,'ai_data_rules') : 'not_applicable') as NormalisedSignals['aiDataRules'], aiHumanReview: (aiUsed ? one(answers,'ai_human_review') : 'not_applicable') as NormalisedSignals['aiHumanReview'],
  };
}
