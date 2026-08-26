import { describe, expect, it } from 'vitest';
import { processAssessment, type ExplanationInput } from './index';
import type { AnswerMap } from './schema';

const baseline:AnswerMap={company_size:'6_20',sector:'professional_services',critical_systems:['email','cloud_files','customer_data'],work_model:'hybrid',sensitive_data:'high',mfa:'partial',offboarding:'few_days',account_sharing:'some_shared',endpoint_protection:'partial',patching:'manual',backups:'full',restore_test:'never',training:'partial',reporting:'informal',monitoring:'unreviewed',incident_readiness:'informal',external_exposure:'unknown',security_owner:'shared',ai_usage:'none'};
const explain=async(input:ExplanationInput)=>({explanations:input.findings.map(finding=>({findingId:finding.findingId,explanation:finding.rationale})),closingNote:'Review the first practical step at a pace that suits the business.'});
const personas:[string,AnswerMap][]=[
 ['dentist',{...baseline,sector:'healthcare',company_size:'6_20',sensitive_data:'high'}],
 ['attorney',{...baseline,sector:'legal',company_size:'1_5',critical_systems:['email','cloud_files','customer_data']}],
 ['accounting practice',{...baseline,sector:'finance',critical_systems:['email','accounting','customer_data']}],
 ['retail shop',{...baseline,sector:'retail',company_size:'1_5',work_model:'office',critical_systems:['accounting','website']}],
 ['logistics company',{...baseline,sector:'other',company_size:'21_50',critical_systems:['email','line_of_business','accounting']}],
 ['school',{...baseline,sector:'education',company_size:'51_100',sensitive_data:'high'}],
 ['creative agency',{...baseline,sector:'professional_services',ai_usage:'regular',ai_data_rules:'informal',ai_human_review:'usually'}],
 ['engineering consultancy',{...baseline,sector:'professional_services',company_size:'21_50',work_model:'remote'}],
 ['nonprofit',{...baseline,sector:'other',company_size:'6_20',sensitive_data:'medium'}],
 ['software company',{...baseline,sector:'technology',mfa:'full',offboarding:'same_day',account_sharing:'individual',endpoint_protection:'yes',patching:'automatic',restore_test:'three_months',training:'yes',reporting:'clear',monitoring:'monitored',incident_readiness:'clear',external_exposure:'known',security_owner:'clear'}],
];

describe('launch persona review',()=>{
  for(const [name,answers] of personas)it(`produces an explainable, restrained snapshot for a ${name}`,async()=>{const result=await processAssessment({answers},{explain,now:()=>new Date('2026-08-26T12:00:00Z')});expect(result.findings.length).toBeGreaterThan(0);expect(result.findings.length).toBeLessThanOrEqual(3);expect(result.nextActions.length).toBeLessThanOrEqual(3);expect(result.findings.every(finding=>result.evidencePanels.some(panel=>panel.findingId===finding.id))).toBe(true);expect(JSON.stringify(result)).not.toMatch(/overallScore|riskBand|benchmark|ruleId/);expect(result.nextActions.every(action=>action.title&&action.description)).toBe(true);});
});
