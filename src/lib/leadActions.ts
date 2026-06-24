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
  categoryScores?: Record<string, { name: string; score: number; maxScore: number; percentage: number }>;
  risks?: string[];
  recommendations?: { recommendation: string; priority: string }[];
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

export interface CategoryScore {
  name: string;
  score: number;
  maxScore: number;
  percentage: number;
}

export interface EmailReportPayload {
  email: string;
  score: number;
  scoreLabel: string;
  sector: string;
  companySize: string;
  categoryScores: Record<string, CategoryScore>;
  risks: string[];
  strengths: string[];
  recommendations: { recommendation: string; priority: string }[];
}

function buildScoreColor(score: number): string {
  if (score >= 75) return '#22c55e';
  if (score >= 50) return '#eab308';
  if (score >= 25) return '#f97316';
  return '#ef4444';
}

function buildPriorityBadge(priority: string): { label: string; bg: string; color: string; border: string } {
  switch (priority) {
    case 'high':
      return { label: 'HIGH', bg: '#450a0a', color: '#ef4444', border: '#7f1d1d' };
    case 'medium':
      return { label: 'MEDIUM', bg: '#451a03', color: '#f97316', border: '#7c2d12' };
    default:
      return { label: 'LOW', bg: '#052e16', color: '#22c55e', border: '#14532d' };
  }
}

function buildRiskBandLabel(score: number): string {
  if (score >= 85) return 'Strong Posture';
  if (score >= 70) return 'Low Risk';
  if (score >= 50) return 'Moderate Risk';
  if (score >= 25) return 'High Risk';
  return 'Critical Risk';
}

export async function emailReport(
  payload: EmailReportPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.NOTIFICATION_EMAIL_FROM ?? 'Clarity by Tanosec <clarity@tanosec.co.za>';
    if (!apiKey) {
      console.warn('[Clarity] RESEND_API_KEY not set — skipping user email report');
      return { success: true };
    }

    const scoreColor = buildScoreColor(payload.score);
    const scoreLabel = payload.scoreLabel || buildRiskBandLabel(payload.score);

    // Build category breakdown rows
    const categoryRows = Object.entries(payload.categoryScores)
      .filter(([, s]) => s.maxScore > 0)
      .map(([catId, s]) => {
        const barColor = buildScoreColor(s.percentage);
        const barWidth = Math.round(s.percentage);
        return `
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #222;font-size:13px;color:#888;vertical-align:middle;">
              ${s.name}
            </td>
            <td style="padding:10px 0;border-bottom:1px solid #222;vertical-align:middle;">
              <div style="background:#222;border-radius:4px;height:8px;width:160px;overflow:hidden;">
                <div style="background:${barColor};height:8px;width:${barWidth}%;border-radius:4px;"></div>
              </div>
            </td>
            <td style="padding:10px 0 10px 16px;border-bottom:1px solid #222;font-size:14px;color:${barColor};font-weight:700;text-align:right;white-space:nowrap;">
              ${s.score}/${s.maxScore}
            </td>
          </tr>`;
      })
      .join('');

    // Build risks list
    const risksList = payload.risks.length > 0
      ? payload.risks.map(r => `
          <div style="display:flex;align-items:flex-start;gap:10px;padding:12px 14px;background:#1c0a0a;border:1px solid #450a0a;border-radius:8px;margin-bottom:10px;">
            <span style="color:#ef4444;font-size:16px;line-height:1;padding-top:2px;">⚠️</span>
            <span style="color:#fca5a5;font-size:14px;line-height:1.5;">${r}</span>
          </div>`).join('')
      : '<p style="color:#888;font-size:14px;">No significant risks identified.</p>';
    // Build strengths list
    const strengthsList = payload.strengths.length > 0
      ? payload.strengths.map(s => `
          <div style="display:flex;align-items:flex-start;gap:10px;padding:12px 14px;background:#052e16;border:1px solid #14532d;border-radius:8px;margin-bottom:10px;">
            <span style="color:#22c55e;font-size:16px;line-height:1;padding-top:2px;">🛡️</span>
            <span style="color:#86efac;font-size:14px;line-height:1.5;">${s}</span>
          </div>`).join('')
      : '<p style="color:#888;font-size:14px;">Keep building your security posture.</p>';

    // Build recommendations list
    const recsList = payload.recommendations.map(rec => {
      const badge = buildPriorityBadge(rec.priority);
      return `
        <div style="display:flex;align-items:flex-start;gap:14px;padding:16px;background:#111;border:1px solid #222;border-radius:10px;margin-bottom:12px;">
          <div style="background:${badge.bg};border:1px solid ${badge.border};border-radius:6px;padding:4px 10px;white-space:nowrap;">
            <span style="color:${badge.color};font-size:11px;font-weight:700;letter-spacing:0.05em;">${badge.label}</span>
          </div>
          <p style="color:#e5e5e5;font-size:14px;line-height:1.6;margin:0;">${rec.recommendation}</p>
        </div>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Clarity Security Report</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;color:#e5e5e5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr>
      <td>
        <table width="640" align="center" cellpadding="0" cellspacing="0" style="background:#111;border-radius:16px;border:1px solid #222;max-width:640px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding:28px 36px 24px;border-bottom:1px solid #222;">
              <p style="margin:0;font-size:11px;color:#555;text-transform:uppercase;letter-spacing:0.1em;">Clarity by Tanosec</p>
              <h1 style="margin:6px 0 0;font-size:26px;color:#fff;font-weight:700;">Your Security Report</h1>
              <p style="margin:6px 0 0;font-size:14px;color:#666;">Tailored cybersecurity insights for your business</p>
            </td>
          </tr>

          <!-- Score Hero -->
          <tr>
            <td style="padding:32px 36px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#161616;border-radius:12px;border:1px solid #222;">
                <tr>
                  <td style="padding:28px;text-align:center;">
                    <p style="margin:0;font-size:11px;color:#555;text-transform:uppercase;letter-spacing:0.08em;">Overall Security Score</p>
                    <p style="margin:10px 0 6px;font-size:72px;font-weight:800;color:${scoreColor};line-height:1;">${payload.score}%</p>
                    <p style="margin:0;font-size:18px;font-weight:700;color:${scoreColor};">${scoreLabel}</p>
                    ${payload.sector ? `<p style="margin:10px 0 0;font-size:13px;color:#666;">${payload.sector}${payload.companySize ? ` · ${payload.companySize}` : ''}</p>` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Domain Breakdown -->
          <tr>
            <td style="padding:0 36px 8px;">
              <h2 style="margin:0;font-size:15px;color:#888;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;">Domain Breakdown</h2>
            </td>
          </tr>
          <tr>
            <td style="padding:0 36px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#161616;border-radius:12px;border:1px solid #222;overflow:hidden;">
                ${categoryRows}
              </table>
            </td>
          </tr>

          <!-- Risks & Strengths -->
          <tr>
            <td style="padding:0 36px 8px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:50%;padding-right:10px;vertical-align:top;">
                    <h2 style="margin:0 0 12px;font-size:15px;color:#ef4444;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;">⚠️ AI-Identified Risks</h2>
                    ${risksList}
                  </td>
                  <td style="width:50%;padding-left:10px;vertical-align:top;">
                    <h2 style="margin:0 0 12px;font-size:15px;color:#22c55e;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;">🛡️ Your Strengths</h2>
                    ${strengthsList}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Recommendations -->
          <tr>
            <td style="padding:0 36px 8px;">
              <h2 style="margin:0;font-size:15px;color:#888;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;">📋 Your Action Plan</h2>
            </td>
          </tr>
          <tr>
            <td style="padding:0 36px 28px;">
              ${recsList}
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:0 36px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#111;border-radius:12px;border:1px solid #1a3a1a;overflow:hidden;">
                <tr>
                  <td style="padding:28px 32px;text-align:center;background:linear-gradient(135deg,#0d2b0d 0%,#0a1f0a 100%);">
                    <p style="margin:0 0 4px;font-size:13px;color:#666;text-transform:uppercase;letter-spacing:0.08em;">Ready to take the next step?</p>
                    <p style="margin:0 0 20px;font-size:17px;color:#ccc;line-height:1.5;">Book a free 30-minute consultation with a Tanosec cybersecurity expert and get a prioritised remediation roadmap.</p>
                    <a href="https://calendly.com/tanosec" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#16a34a;color:#fff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:8px;letter-spacing:0.02em;">Book a Free Consultation →</a>
                    <p style="margin:16px 0 0;font-size:12px;color:#555;">calendly.com/tanosec · No commitment required</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 36px;border-top:1px solid #222;text-align:center;">
              <p style="margin:0;font-size:12px;color:#444;">Clarity by Tanosec · <a href="https://tanosec.co.za" style="color:#555;text-decoration:none;">tanosec.co.za</a> · <a href="mailto:support@tanosec.co.za" style="color:#555;text-decoration:none;">support@tanosec.co.za</a></p>
              <p style="margin:8px 0 0;font-size:11px;color:#333;">This report was generated based on your self-assessment. Results are indicative and should be validated by a qualified cybersecurity professional.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [payload.email],
        subject: `Your Clarity Security Report — ${payload.score}% (${scoreLabel})`,
        html,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[Clarity] emailReport Resend error:', errText);
      return { success: false, error: 'Email send failed' };
    }

    console.log('[Clarity] emailReport sent to:', payload.email);
    return { success: true };
  } catch (error) {
    console.error('[Clarity] Unexpected error in emailReport:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
