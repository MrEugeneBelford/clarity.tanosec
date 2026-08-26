'use server';
import { processAssessment, type ClaritySnapshot } from './assessmentProcessor';
export async function processAssessmentAction(answers:unknown):Promise<{snapshot?:ClaritySnapshot;error?:string}>{ try{return {snapshot:await processAssessment({answers})};}catch(error){console.error('[Clarity v2] Assessment failed',error);return {error:'We could not process this assessment. Please review your answers and try again.'};} }
