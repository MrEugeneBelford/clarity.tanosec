'use server';

import { headers } from 'next/headers';
import { buildInternalEmailHtml, buildUserEmailHtml, buildWhatsAppText, toPublicSnapshot } from './reporting';
import { createRateLimiter } from './rateLimit';

export interface SnapshotDeliveryResult { success: boolean; userEmailSent: boolean; internalEmailSent: boolean; whatsappSent: boolean; error?: string }
const deliveryLimiter=createRateLimiter(5,60*60_000);
async function requestKey():Promise<string>{const requestHeaders=await headers();return(requestHeaders.get('x-nf-client-connection-ip')||requestHeaders.get('x-forwarded-for')?.split(',')[0]||'unknown').trim().slice(0,80);}

async function sendResend(to: string, subject: string, html: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATION_EMAIL_FROM;
  if (!apiKey || !from) return false;
  const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from, to: [to], subject, html }), signal:AbortSignal.timeout(8_000) });
  if (!response.ok) console.error('[Clarity v2] Resend delivery failed', response.status);
  return response.ok;
}

async function sendWhatsApp(text: string): Promise<boolean> {
  const token = process.env.WHAPI_TOKEN;
  const to = process.env.WHAPI_TO_NUMBER;
  if (!token || !to) return false;
  const response = await fetch('https://gate.whapi.cloud/messages/text', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ to, body: text }), signal:AbortSignal.timeout(8_000) });
  if (!response.ok) console.error('[Clarity v2] WhatsApp delivery failed', response.status);
  return response.ok;
}

export async function submitSnapshotDelivery(input: { email: string; newsletterOptIn: boolean; snapshot: unknown }): Promise<SnapshotDeliveryResult> {
  const limit=deliveryLimiter.check(await requestKey());
  if(!limit.allowed)return { success:false,userEmailSent:false,internalEmailSent:false,whatsappSent:false,error:'Too many delivery requests were made from this connection. Please wait before trying again.' };
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { success: false, userEmailSent: false, internalEmailSent: false, whatsappSent: false, error: 'Please enter a valid email address.' };
  try {
    const snapshot = toPublicSnapshot(input.snapshot);
    const [userEmailSent, internalEmailSent, whatsappSent] = await Promise.all([
      sendResend(email, 'Your Clarity Snapshot', buildUserEmailHtml(snapshot)),
      process.env.NOTIFICATION_EMAIL_TO ? sendResend(process.env.NOTIFICATION_EMAIL_TO, `New Clarity assessment — ${snapshot.businessContext.sector}`, buildInternalEmailHtml(snapshot, email, input.newsletterOptIn)) : Promise.resolve(false),
      sendWhatsApp(buildWhatsAppText(snapshot, email)),
    ]);
    return { success: true, userEmailSent, internalEmailSent, whatsappSent };
  } catch (error) {
    console.error('[Clarity v2] Snapshot delivery failed', error instanceof Error ? error.message : 'Unknown error');
    return { success: false, userEmailSent: false, internalEmailSent: false, whatsappSent: false, error: 'We could not send the snapshot. Please try again.' };
  }
}
