'use server';

import { buildInternalEmailHtml, buildUserEmailHtml, buildWhatsAppText, toPublicSnapshot } from './reporting';

export interface SnapshotDeliveryResult { success: boolean; userEmailSent: boolean; internalEmailSent: boolean; whatsappSent: boolean; error?: string }

async function sendResend(to: string, subject: string, html: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATION_EMAIL_FROM;
  if (!apiKey || !from) return false;
  const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from, to: [to], subject, html }) });
  if (!response.ok) console.error('[Clarity v2] Resend delivery failed', response.status);
  return response.ok;
}

async function sendWhatsApp(text: string): Promise<boolean> {
  const token = process.env.WHAPI_TOKEN;
  const to = process.env.WHAPI_TO_NUMBER;
  if (!token || !to) return false;
  const response = await fetch('https://gate.whapi.cloud/messages/text', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ to, body: text }) });
  if (!response.ok) console.error('[Clarity v2] WhatsApp delivery failed', response.status);
  return response.ok;
}

export async function submitSnapshotDelivery(input: { email: string; newsletterOptIn: boolean; snapshot: unknown }): Promise<SnapshotDeliveryResult> {
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
