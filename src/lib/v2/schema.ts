import { z } from 'zod';

export const DOMAINS = ['business_context', 'identity_access', 'devices_updates', 'data_recovery', 'people_awareness', 'visibility_response', 'responsibility', 'ai_usage'] as const;
export type Domain = typeof DOMAINS[number];

export interface QuestionOption { id: string; label: string }
export interface QuestionDefinition {
  id: string;
  domain: Domain;
  wording: string;
  options: readonly QuestionOption[];
  multiple?: boolean;
  when?: (answers: AnswerMap) => boolean;
}

export type AnswerMap = Record<string, string | readonly string[]>;
const option = (id: string, label: string): QuestionOption => ({ id, label });
const scale = [option('yes', 'Yes'), option('partial', 'Some / partly'), option('no', 'No'), option('unknown', 'Not sure')];

export const QUESTIONS: readonly QuestionDefinition[] = [
  { id: 'company_size', domain: 'business_context', wording: 'How many people work in the business?', options: [option('1_5', '1–5'), option('6_20', '6–20'), option('21_50', '21–50'), option('51_100', '51–100'), option('100_plus', '100+')] },
  { id: 'sector', domain: 'business_context', wording: 'Which best describes the business?', options: ['professional_services','retail','healthcare','legal','finance','education','manufacturing','technology','other'].map(id => option(id, id.replaceAll('_', ' '))) },
  { id: 'critical_systems', domain: 'business_context', wording: 'Which systems would seriously disrupt the business if unavailable?', multiple: true, options: ['email','cloud_files','accounting','customer_data','line_of_business','website','other','none'].map(id => option(id, id.replaceAll('_', ' '))) },
  { id: 'work_model', domain: 'business_context', wording: 'How does your team normally work?', options: [option('office', 'Mostly office'), option('remote', 'Mostly remote'), option('hybrid', 'Hybrid')] },
  { id: 'sensitive_data', domain: 'business_context', wording: 'Do you handle information that would cause a serious problem if exposed?', options: [option('high', 'Yes'), option('medium', 'Some'), option('low', 'Probably not'), option('unknown', 'Not sure')] },
  { id: 'mfa', domain: 'identity_access', wording: 'Are important business accounts protected by MFA?', options: [option('full', 'Yes, almost all'), option('partial', 'Some'), option('none', 'No'), option('unknown', 'Not sure')] },
  { id: 'offboarding', domain: 'identity_access', wording: 'How quickly is access removed when someone leaves?', options: [option('same_day', 'Same day'), option('few_days', 'Within a few days'), option('ad_hoc', 'When someone remembers'), option('unknown', 'Not sure')] },
  { id: 'account_sharing', domain: 'identity_access', wording: 'Do people use individual or shared accounts?', options: [option('individual', 'Individual accounts'), option('some_shared', 'Mostly individual'), option('many_shared', 'Many shared'), option('unknown', 'Not sure')] },
  { id: 'endpoint_protection', domain: 'devices_updates', wording: 'Are business devices centrally protected?', options: scale },
  { id: 'patching', domain: 'devices_updates', wording: 'How are security updates handled?', options: [option('automatic', 'Automatically'), option('manual', 'Manually'), option('delayed', 'Often delayed'), option('unknown', 'Not sure')] },
  { id: 'backups', domain: 'data_recovery', wording: 'Are important business files backed up?', options: [option('full', 'Yes'), option('partial', 'Some'), option('none', 'No'), option('unknown', 'Not sure')] },
  { id: 'restore_test', domain: 'data_recovery', wording: 'When was a backup last restored to prove it works?', when: a => a.backups === 'full' || a.backups === 'partial', options: [option('three_months', 'Within 3 months'), option('year', 'Within 12 months'), option('old', 'More than a year ago'), option('never', 'Never'), option('unknown', 'Not sure')] },
  { id: 'training', domain: 'people_awareness', wording: 'Has the team had practical security training in the last year?', options: scale },
  { id: 'reporting', domain: 'people_awareness', wording: 'Do people know who to report suspicious activity to?', options: [option('clear', 'Yes'), option('informal', 'Probably'), option('none', 'No'), option('unknown', 'Not sure')] },
  { id: 'monitoring', domain: 'visibility_response', wording: 'Would someone notice unusual login activity?', options: [option('monitored', 'Alerts are monitored'), option('unreviewed', 'Alerts are not regularly reviewed'), option('none', 'Probably not'), option('unknown', 'Not sure')] },
  { id: 'incident_readiness', domain: 'visibility_response', wording: 'Would you know what to do first after discovering a compromised account?', options: [option('clear', 'Clear process'), option('informal', 'Informal idea'), option('none', 'No'), option('unknown', 'Not sure')] },
  { id: 'external_exposure', domain: 'visibility_response', wording: 'Do you know what the business exposes to the internet?', options: [option('known', 'Yes'), option('mostly', 'Mostly'), option('unknown', 'Not sure'), option('not_known', 'No')] },
  { id: 'security_owner', domain: 'responsibility', wording: 'Is someone clearly responsible for cybersecurity decisions?', options: [option('clear', 'Yes'), option('shared', 'Shared responsibility'), option('none', 'Not really'), option('unknown', 'Not sure')] },
  { id: 'ai_usage', domain: 'ai_usage', wording: 'Do people use AI tools for work?', options: [option('regular', 'Yes, regularly'), option('occasional', 'Sometimes'), option('unaware', 'Not that we know of'), option('none', 'No'), option('unknown', 'Not sure')] },
  { id: 'ai_data_rules', domain: 'ai_usage', wording: 'Are there clear rules about information entered into AI tools?', when: a => a.ai_usage === 'regular' || a.ai_usage === 'occasional', options: [option('clear', 'Yes'), option('informal', 'Informal guidance'), option('none', 'No'), option('unknown', 'Not sure')] },
  { id: 'ai_human_review', domain: 'ai_usage', wording: 'Is important AI-generated work reviewed by a person?', when: a => a.ai_usage === 'regular' || a.ai_usage === 'occasional', options: [option('always', 'Always'), option('usually', 'Usually'), option('sometimes', 'Sometimes'), option('rarely', 'Rarely / never'), option('unknown', 'Not sure')] },
] as const;

export const questionById = new Map(QUESTIONS.map(question => [question.id, question]));
export const applicableQuestions = (answers: AnswerMap) => QUESTIONS.filter(question => !question.when || question.when(answers));

export const submissionSchema = z.object({ answers: z.record(z.string(), z.union([z.string(), z.array(z.string())])) }).strict().superRefine(({ answers }, ctx) => {
  for (const [questionId, answer] of Object.entries(answers)) {
    const question = questionById.get(questionId);
    if (!question) { ctx.addIssue({ code: 'custom', path: ['answers', questionId], message: 'Unknown question' }); continue; }
    if (question.when && !question.when(answers)) ctx.addIssue({ code: 'custom', path: ['answers', questionId], message: 'Question is not applicable' });
    const values = Array.isArray(answer) ? answer : [answer];
    if (Array.isArray(answer) !== Boolean(question.multiple)) ctx.addIssue({ code: 'custom', path: ['answers', questionId], message: question.multiple ? 'Expected multiple answers' : 'Expected one answer' });
    if (values.some(value => !question.options.some(candidate => candidate.id === value))) ctx.addIssue({ code: 'custom', path: ['answers', questionId], message: 'Unknown option' });
  }
});
