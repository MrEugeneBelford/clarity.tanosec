'use server';
import { headers } from 'next/headers';
import { processAssessment, type ClaritySnapshot } from './assessmentProcessor';
import { createRateLimiter } from './rateLimit';

const assessmentLimiter=createRateLimiter(10,5*60_000);
async function requestKey():Promise<string>{const requestHeaders=await headers();return(requestHeaders.get('x-nf-client-connection-ip')||requestHeaders.get('x-forwarded-for')?.split(',')[0]||'unknown').trim().slice(0,80);}

export async function processAssessmentAction(answers:unknown):Promise<{snapshot?:ClaritySnapshot;error?:string}>{
 try{
  const limit=assessmentLimiter.check(await requestKey());
  if(!limit.allowed)return{error:'Too many assessments were submitted from this connection. Please wait a few minutes and try again.'};
  return {snapshot:await processAssessment({answers})};
 }catch(error){console.error('[Clarity v2] Assessment failed',error instanceof Error?error.name:'Unknown error');return {error:'We could not process this assessment. Please review your answers and try again.'};}
}
