import type{DisplayFinding}from '@/lib/v2/assessmentProcessor';
export const shouldShowExplanation=(finding:DisplayFinding,index:number,unlocked:boolean)=>unlocked||index===0||finding.priority==='positive';
