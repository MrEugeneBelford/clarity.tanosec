import { describe, expect, it } from 'vitest';
import { applicableQuestions, deriveContext, normaliseSignals, QUESTIONS, resolveActions, runRules, selectFindings, submissionSchema, TANOSEC_SERVICE_IDS, createRateLimiter, type AnswerMap } from './index';

const base: AnswerMap = { company_size:'6_20', sector:'professional_services', critical_systems:['email','cloud_files','customer_data'], work_model:'hybrid', sensitive_data:'high', mfa:'partial', offboarding:'few_days', account_sharing:'some_shared', endpoint_protection:'partial', patching:'manual', remote_wipe:'partial', backups:'full', restore_test:'never', training:'partial', reporting:'informal', phishing_test:'never', monitoring:'unreviewed', incident_readiness:'informal', external_exposure:'unknown', security_owner:'shared', ai_usage:'none' };

describe('question registry and validation', () => {
  it('contains a concise core with conditional follow-ups', () => { expect(QUESTIONS.length).toBeGreaterThanOrEqual(16); expect(QUESTIONS.length).toBeLessThanOrEqual(23); expect(new Set(QUESTIONS.map(q=>q.id)).size).toBe(QUESTIONS.length); });
  it('shows restore follow-up only when backups exist', () => { expect(applicableQuestions({...base,backups:'none'}).some(q=>q.id==='restore_test')).toBe(false); expect(applicableQuestions(base).some(q=>q.id==='restore_test')).toBe(true); });
  it('shows AI follow-ups only for confirmed use', () => { expect(applicableQuestions(base).some(q=>q.id==='ai_data_rules')).toBe(false); expect(applicableQuestions({...base,ai_usage:'regular'}).some(q=>q.id==='ai_data_rules')).toBe(true); });
  it('rejects unknown question and option IDs', () => { expect(submissionSchema.safeParse({answers:{mfa:'invented'}}).success).toBe(false); expect(submissionSchema.safeParse({answers:{invented:'yes'}}).success).toBe(false); });
  it('rejects answers to inapplicable conditionals', () => { expect(submissionSchema.safeParse({answers:{ai_usage:'none',ai_data_rules:'clear'}}).success).toBe(false); });
});

describe('normalised signals and context', () => {
  it('keeps unknown distinct from absent', () => { expect(normaliseSignals({...base,mfa:'unknown'}).mfa).toBe('unknown'); expect(normaliseSignals({...base,mfa:'none'}).mfa).toBe('none'); });
  it('marks conditional signals not applicable', () => { const s=normaliseSignals({...base,backups:'none',ai_usage:'none'}); expect(s.restoreTest).toBe('not_applicable'); expect(s.aiDataRules).toBe('not_applicable'); });
  it('derives compound identity context', () => { expect(deriveContext(normaliseSignals({...base,mfa:'none',offboarding:'ad_hoc',account_sharing:'many_shared'})).identity_protection).toBe('weak'); });
  it('does not use sector to increase severity', () => { const a=deriveContext(normaliseSignals({...base,sector:'healthcare'})); const b=deriveContext(normaliseSignals({...base,sector:'retail'})); expect(a).toEqual(b); });
  it('requires confirmed AI use for high AI exposure', () => { expect(deriveContext(normaliseSignals({...base,ai_usage:'unaware',ai_data_rules:'unknown'})).ai_data_exposure_risk).toBe('not_applicable'); expect(deriveContext(normaliseSignals({...base,ai_usage:'regular',ai_data_rules:'none',ai_human_review:'rarely'})).ai_data_exposure_risk).toBe('high'); });
});

describe('deterministic rules, findings, and actions', () => {
  it('fires and clears the compound identity rule', () => { const weak=runRules({signals:normaliseSignals({...base,mfa:'none',offboarding:'ad_hoc',account_sharing:'many_shared'}),context:deriveContext(normaliseSignals({...base,mfa:'none',offboarding:'ad_hoc',account_sharing:'many_shared'}))}); expect(weak.some(f=>f.id==='identity_compound')).toBe(true); const strongSignals=normaliseSignals({...base,mfa:'full',offboarding:'same_day',account_sharing:'individual'}); expect(runRules({signals:strongSignals,context:deriveContext(strongSignals)}).some(f=>f.id==='identity_compound')).toBe(false); });
  it('surfaces absent recovery as address first', () => { const s=normaliseSignals({...base,backups:'none'}); const result=runRules({signals:s,context:deriveContext(s)}).find(f=>f.id==='recovery_absent'); expect(result?.priority).toBe('address_first'); });
  it('treats recovery uncertainty honestly', () => { const s=normaliseSignals({...base,backups:'unknown'}); expect(runRules({signals:s,context:deriveContext(s)}).some(f=>f.id==='recovery_absent')).toBe(false); });
  it('never promotes AI uncertainty to address first', () => { const s=normaliseSignals({...base,ai_usage:'unaware'}); const result=runRules({signals:s,context:deriveContext(s)}).find(f=>f.id==='ai_visibility'); expect(result?.priority).toBe('understand'); expect(result?.title).toContain('clear picture'); });
  it('can return multiple genuine positives without manufacturing gaps', () => { const s=normaliseSignals({...base,mfa:'full',offboarding:'same_day',account_sharing:'individual',backups:'full',restore_test:'three_months',training:'yes',reporting:'clear',phishing_test:'recent',endpoint_protection:'yes',patching:'automatic',remote_wipe:'yes',monitoring:'monitored',incident_readiness:'clear',external_exposure:'known',security_owner:'clear'}); const selected=selectFindings(runRules({signals:s,context:deriveContext(s)})); expect(selected.filter(f=>f.priority==='positive').length).toBe(3); });
  it('selects deterministically and preserves semantic priorities', () => { const s=normaliseSignals(base); const candidates=runRules({signals:s,context:deriveContext(s)}); expect(selectFindings(candidates)).toEqual(selectFindings([...candidates].reverse())); expect(selectFindings(candidates).every(f=>candidates.includes(f))).toBe(true); });
  it('prioritises actions across all fired findings, not only display findings', () => { const s=normaliseSignals({...base,backups:'none',mfa:'none',offboarding:'ad_hoc',account_sharing:'many_shared'}); const candidates=runRules({signals:s,context:deriveContext(s)}); expect(resolveActions(candidates).map(a=>a.id)).toContain('establish_backups'); });
  it('keeps service metadata independent from findings', () => { const s=normaliseSignals(base); const findings=runRules({signals:s,context:deriveContext(s)}); expect(JSON.stringify(findings)).not.toContain('tanosec_service'); expect(resolveActions(findings).filter(a=>a.serviceId).every(a=>TANOSEC_SERVICE_IDS.includes(a.serviceId!))).toBe(true); });
  it('contains no aggregate score or percentage contract', () => { for (const value of [normaliseSignals(base),deriveContext(normaliseSignals(base)),...runRules({signals:normaliseSignals(base),context:deriveContext(normaliseSignals(base))})]) { expect(value).not.toHaveProperty('score'); expect(value).not.toHaveProperty('percentage'); } });
});

describe('rate limiting', () => {
  it('limits by key and resets after the window', () => { let time=0; const limiter=createRateLimiter(2,100,()=>time); expect(limiter.check('a').allowed).toBe(true); expect(limiter.check('a').allowed).toBe(true); expect(limiter.check('a').allowed).toBe(false); expect(limiter.check('b').allowed).toBe(true); time=101; expect(limiter.check('a').allowed).toBe(true); });
});
