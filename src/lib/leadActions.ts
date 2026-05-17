'use server';

import { notifyNewAssessment } from './notifications';

const TELEGRAM_CHAT_ID = '8460565721';

export async function saveLeadCapture(data: {
  email?: string;
  newsletterOptIn?: boolean;
  score: number;
  scoreLabel: string;
  sector?: string;
  companySize?: string;
  worstCategory?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Basic email validation if provided
    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        return { success: false, error: 'Invalid email address' };
      }
    }

    const timestamp = new Date().toLocaleString('en-ZA', {
      timeZone: 'Africa/Johannesburg',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    await notifyNewAssessment({
      ...data,
      timestamp,
    });

    return { success: true };
  } catch (err) {
    console.error('[Clarity] saveLeadCapture failed:', err);
    return { success: false, error: 'Notification failed' };
  }
}

export interface EmailReportPayload {
  email: string;
  score: number;
  scoreLabel: string;
  sector: string;
  companySize: string;
  risks: string[];
  strengths: string[];
  recommendations: { recommendation: string; priority: string }[];
}

export async function emailReport(
  payload: EmailReportPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.error('[leadActions] TELEGRAM_BOT_TOKEN is not set — skipping email report notification.');
      return { success: true };
    }

    const message = [
      '📋 Report email requested',
      `📧 ${payload.email}`,
      `📊 ${payload.score}% — ${payload.scoreLabel}`,
      '',
      'Note: implement email delivery via your preferred provider (Resend, SendGrid, etc.)'
    ].join('\n');

    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[leadActions] Telegram API error:', response.status, errorText);
    }

    return { success: true };
  } catch (error) {
    console.error('[leadActions] Unexpected error in emailReport:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
