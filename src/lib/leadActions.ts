'use server';

import { notifyNewAssessment } from '@/lib/notifications';

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
    console.log('[leadActions] emailReport requested for:', payload.email);
    return { success: true };
  } catch (error) {
    console.error('[leadActions] Unexpected error in emailReport:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
