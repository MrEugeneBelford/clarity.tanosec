import type { LegacyAnswers } from '@/lib/legacy/scoring';
export const CLARITY_DRAFT_KEY='clarity_answers_draft';
export function parseDraft(value:string|null):LegacyAnswers { if(!value)return {}; try { const parsed:unknown=JSON.parse(value); if(!parsed||Array.isArray(parsed)||typeof parsed!=='object')return {}; return Object.fromEntries(Object.entries(parsed).filter((entry):entry is [string,string]=>typeof entry[1]==='string')); } catch{return {};} }
export function serialiseDraft(answers:LegacyAnswers):string|null { return Object.keys(answers).length?JSON.stringify(answers):null; }
