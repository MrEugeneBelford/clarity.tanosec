'use server';

export interface CategoryScore {
  name: string;
  score: number;
  maxScore: number;
  percentage: number;
}

export interface LeadNotificationPayload {
  email?: string;
  newsletterOptIn?: boolean;
  score: number;
  scoreLabel: string;
  sector?: string;
  companySize?: string;
  worstCategory?: string;
  timestamp: string;
  categoryScores?: Record<string, CategoryScore>;
  risks?: string[];
  recommendations?: { recommendation: string; priority: string }[];
}

async function sendWhatsAppNotification(payload: LeadNotificationPayload): Promise<void> {
  const token = process.env.WHAPI_TOKEN;
  const toNumber = process.env.WHAPI_TO_NUMBER;
  if (!token || !toNumber) {
    console.warn('[Clarity] WhatsApp env vars not set — skipping');
    return;
  }

  const emoji = payload.score >= 75 ? '🟢' : payload.score >= 50 ? '🟡' : payload.score >= 25 ? '🟠' : '🔴';

  // Build category breakdown section
  let categoryBreakdown = '';
  if (payload.categoryScores) {
    const lines = Object.entries(payload.categoryScores)
      .filter(([, s]) => s.maxScore > 0)
      .map(([catId, s]) => {
        const shortName = s.name
          .replace(' & Authentication', '')
          .replace(' & Backup', '')
          .replace(' & Training', '')
          .replace(' & Recovery', '')
          .replace(' & Risk', '')
          .replace(' & ', ' ');
        return `${shortName}: ${s.score}/${s.maxScore} (${Math.round(s.percentage)}%)`;
      });
    categoryBreakdown = lines.join('\n');
  }

  // Build top 3 risks
  const topRisks = (payload.risks || []).slice(0, 3);
  const risksSection = topRisks.length > 0
    ? `--- TOP RISKS ---\n${topRisks.map((r, i) => `${i + 1}. ${r}`).join('\n')}`
    : '';

  // Build top 3 recommendations with priority
  const topRecs = (payload.recommendations || []).slice(0, 3);
  const recsSection = topRecs.length > 0
    ? `--- RECOMMENDATIONS ---\n${topRecs.map(r => `{${r.priority.toUpperCase()}} ${r.recommendation}`).join('\n')}`
    : '';

  const message = [
    `🛡️ NEW CLARITY ASSESSMENT`,
    ``,
    `📊 Score: ${payload.score}% — ${payload.scoreLabel}`,
    payload.email ? `📧 ${payload.email}` : `📧 No email provided`,
    payload.sector ? `🏢 ${payload.sector}` : `🏢 Sector not specified`,
    payload.companySize ? `👥 ${payload.companySize}` : `👥 Size not specified`,
    ``,
    `--- CATEGORY BREAKDOWN ---`,
    categoryBreakdown,
    payload.worstCategory ? `⚠️ Biggest gap: ${payload.worstCategory}` : '',
    ``,
    risksSection,
    recsSection ? `\n${recsSection}` : '',
    ``,
    `🕒 ${payload.timestamp}`,
  ].filter(Boolean).join('\n');

  try {
    const response = await fetch('https://gate.whapi.cloud/messages/text', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to: toNumber, body: message }),
    });
    if (!response.ok) {
      console.error('[Clarity] Whapi error:', await response.text());
    } else {
      console.log('[Clarity] WhatsApp notification sent');
    }
  } catch (err) {
    console.error('[Clarity] WhatsApp failed:', err);
  }
}

async function sendEmailNotification(payload: LeadNotificationPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.NOTIFICATION_EMAIL_TO;
  const fromEmail = process.env.NOTIFICATION_EMAIL_FROM;
  if (!apiKey || !toEmail || !fromEmail) {
    console.warn('[Clarity] Resend env vars not set — skipping');
    return;
  }

  const scoreColour = payload.score >= 75 ? '#22c55e' : payload.score >= 50 ? '#eab308' : payload.score >= 25 ? '#f97316' : '#ef4444';
  const emoji = payload.score >= 75 ? '🟢' : payload.score >= 50 ? '🟡' : payload.score >= 25 ? '🟠' : '🔴';

  // Build category breakdown rows
  const categoryRows = payload.categoryScores
    ? Object.entries(payload.categoryScores)
        .filter(([, s]) => s.maxScore > 0)
        .map(([catId, s]) => {
          const barColor = s.percentage >= 75 ? '#22c55e' : s.percentage >= 50 ? '#eab308' : s.percentage >= 25 ? '#f97316' : '#ef4444';
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
                ${s.score}/${s.maxScore} (${Math.round(s.percentage)}%)
              </td>
            </tr>`;
        }).join('')
    : '';

  // Build top 3 risks
  const topRisks = (payload.risks || []).slice(0, 3);
  const risksList = topRisks.length > 0
    ? topRisks.map(r => `
        <div style="display:flex;align-items:flex-start;gap:10px;padding:12px 14px;background:#1c0a0a;border:1px solid #450a0a;border-radius:8px;margin-bottom:10px;">
          <span style="color:#ef4444;font-size:16px;line-height:1;padding-top:2px;">⚠️</span>
          <span style="color:#fca5a5;font-size:14px;line-height:1.5;">${r}</span>
        </div>`).join('')
    : '<p style="color:#888;font-size:14px;">No significant risks identified.</p>';

  // Build recommendations with priority badges
  const topRecs = (payload.recommendations || []).slice(0, 3);
  const recsList = topRecs.map(rec => {
    const isHigh = rec.priority === 'high';
    const isMedium = rec.priority === 'medium';
    const badgeBg = isHigh ? '#450a0a' : isMedium ? '#451a03' : '#052e16';
    const badgeColor = isHigh ? '#ef4444' : isMedium ? '#f97316' : '#22c55e';
    const badgeBorder = isHigh ? '#7f1d1d' : isMedium ? '#7c2d12' : '#14532d';
    const label = rec.priority.toUpperCase();
    return `
      <div style="display:flex;align-items:flex-start;gap:14px;padding:16px;background:#111;border:1px solid #222;border-radius:10px;margin-bottom:12px;">
        <div style="background:${badgeBg};border:1px solid ${badgeBorder};border-radius:6px;padding:4px 10px;white-space:nowrap;">
          <span style="color:${badgeColor};font-size:11px;font-weight:700;letter-spacing:0.05em;">${label}</span>
        </div>
        <p style="color:#e5e5e5;font-size:14px;line-height:1.6;margin:0;">${rec.recommendation}</p>
      </div>`;
  }).join('');

  const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0f0f0f;font-family:Arial,sans-serif;color:#e5e5e5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td>
      <table width="600" align="center" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:12px;border:1px solid #2a2a2a;max-width:600px;width:100%;">
        <tr><td style="padding:24px 32px;border-bottom:1px solid #2a2a2a;">
          <p style="margin:0;font-size:13px;color:#666;text-transform:uppercase;letter-spacing:0.08em;">Tanosec Cybersecurity</p>
          <h1 style="margin:4px 0 0;font-size:22px;color:#fff;">🛡️ New Clarity Lead</h1>
        </td></tr>
        <tr><td style="padding:28px 32px 0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="background:#222;border-radius:8px;padding:20px;text-align:center;">
              <p style="margin:0;font-size:13px;color:#888;text-transform:uppercase;">Security Score</p>
              <p style="margin:8px 0 4px;font-size:48px;font-weight:700;color:${scoreColour};">${payload.score}%</p>
              <p style="margin:0;font-size:16px;color:${scoreColour};">${payload.scoreLabel}</p>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:24px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #2a2a2a;">
            ${payload.email ? `<tr><td style="padding:12px 0;border-bottom:1px solid #222;font-size:13px;color:#888;width:140px;">Email</td><td style="padding:12px 0;border-bottom:1px solid #222;font-size:14px;color:#e5e5e5;">${payload.email}</td></tr>` : ''}
            ${payload.sector ? `<tr><td style="padding:12px 0;border-bottom:1px solid #222;font-size:13px;color:#888;">Sector</td><td style="padding:12px 0;border-bottom:1px solid #222;font-size:14px;color:#e5e5e5;">${payload.sector}</td></tr>` : ''}
            ${payload.companySize ? `<tr><td style="padding:12px 0;border-bottom:1px solid #222;font-size:13px;color:#888;">Size</td><td style="padding:12px 0;border-bottom:1px solid #222;font-size:14px;color:#e5e5e5;">${payload.companySize}</td></tr>` : ''}
            ${payload.worstCategory ? `<tr><td style="padding:12px 0;border-bottom:1px solid #222;font-size:13px;color:#888;">Biggest gap</td><td style="padding:12px 0;border-bottom:1px solid #222;font-size:14px;color:#f97316;">⚠️ ${payload.worstCategory}</td></tr>` : ''}
            <tr><td style="padding:12px 0;font-size:13px;color:#888;">Submitted</td><td style="padding:12px 0;font-size:14px;color:#e5e5e5;">${payload.timestamp}</td></tr>
          </table>
        </td></tr>
        ${categoryRows ? `
        <tr><td style="padding:0 32px 8px;">
          <h2 style="margin:0;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;">Category Breakdown</h2>
        </td></tr>
        <tr><td style="padding:0 32px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#161616;border-radius:12px;border:1px solid #222;overflow:hidden;">
            ${categoryRows}
          </table>
        </td></tr>` : ''}
        ${topRisks.length > 0 ? `
        <tr><td style="padding:0 32px 8px;">
          <h2 style="margin:0;font-size:13px;color:#ef4444;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;">⚠️ Top Risks</h2>
        </td></tr>
        <tr><td style="padding:0 32px 24px;">
          ${risksList}
        </td></tr>` : ''}
        ${topRecs.length > 0 ? `
        <tr><td style="padding:0 32px 8px;">
          <h2 style="margin:0;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;">📋 Top Recommendations</h2>
        </td></tr>
        <tr><td style="padding:0 32px 28px;">
          ${recsList}
        </td></tr>` : ''}
        <tr><td style="padding:0 32px 28px;"><p style="margin:0;font-size:12px;color:#444;text-align:center;">Clarity by Tanosec · clarity.tanosec.co.za</p></td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject: `${emoji} Clarity Lead — ${payload.score}% (${payload.scoreLabel})${payload.email ? ` · ${payload.email}` : ''}`,
        html,
      }),
    });
    if (!response.ok) {
      console.error('[Clarity] Resend error:', await response.text());
    } else {
      console.log('[Clarity] Email notification sent');
    }
  } catch (err) {
    console.error('[Clarity] Email failed:', err);
  }
}

export async function notifyNewAssessment(payload: LeadNotificationPayload): Promise<void> {
  await Promise.allSettled([
    sendWhatsAppNotification(payload),
    sendEmailNotification(payload),
  ]);
}
