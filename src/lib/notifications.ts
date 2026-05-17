'use server';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LeadNotificationPayload {
  email?: string;
  newsletterOptIn?: boolean;
  score: number;
  scoreLabel: string;
  sector?: string;
  companySize?: string;
  worstCategory?: string;
  timestamp: string;
}

// ─── WhatsApp via Whapi.cloud ─────────────────────────────────────────────────

async function sendWhatsAppNotification(payload: LeadNotificationPayload): Promise<void> {
  const token = process.env.WHAPI_TOKEN;
  const toNumber = process.env.WHAPI_TO_NUMBER;

  if (!token || !toNumber) {
    console.warn('[Clarity] WhatsApp env vars not set — skipping WhatsApp notification');
    return;
  }

  const emoji = payload.score >= 75 ? '🟢' : payload.score >= 50 ? '🟡' : payload.score >= 25 ? '🟠' : '🔴';

  const message = [
    `🦞 *New Clarity Assessment*`,
    ``,
    `${emoji} *Score:* ${payload.score}% — ${payload.scoreLabel}`,
    payload.email    ? `📧 *Email:* ${payload.email}` : `📧 *Email:* Not provided`,
    payload.sector   ? `🏢 *Sector:* ${payload.sector}` : null,
    payload.companySize ? `👥 *Size:* ${payload.companySize}` : null,
    payload.worstCategory ? `⚠️ *Biggest gap:* ${payload.worstCategory}` : null,
    payload.newsletterOptIn ? `📰 *Newsletter:* Yes` : null,
    ``,
    `🕒 ${payload.timestamp}`,
  ]
    .filter(Boolean)
    .join('\n');

  try {
    const response = await fetch('https://gate.whapi.cloud/messages/text', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: toNumber,
        body: message,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[Clarity] Whapi error:', err);
    }
  } catch (err) {
    console.error('[Clarity] WhatsApp notification failed:', err);
  }
}

// ─── Email via Resend ─────────────────────────────────────────────────────────

async function sendEmailNotification(payload: LeadNotificationPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.NOTIFICATION_EMAIL_TO;
  const fromEmail = process.env.NOTIFICATION_EMAIL_FROM;

  if (!apiKey || !toEmail || !fromEmail) {
    console.warn('[Clarity] Resend env vars not set — skipping email notification');
    return;
  }

  const scoreColour = payload.score >= 75 ? '#22c55e' : payload.score >= 50 ? '#eab308' : payload.score >= 25 ? '#f97316' : '#ef4444';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:'Segoe UI',Arial,sans-serif;color:#e5e5e5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:40px 20px;">
    <tr>
      <td>
        <table width="600" align="center" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:12px;border:1px solid #2a2a2a;overflow:hidden;max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:#111;padding:24px 32px;border-bottom:1px solid #2a2a2a;">
              <p style="margin:0;font-size:13px;color:#666;letter-spacing:0.08em;text-transform:uppercase;">Tanosec Cybersecurity</p>
              <h1 style="margin:4px 0 0;font-size:22px;font-weight:600;color:#fff;">🦞 New Clarity Lead</h1>
            </td>
          </tr>
          <!-- Score -->
          <tr>
            <td style="padding:28px 32px 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#222;border-radius:8px;padding:20px 24px;text-align:center;">
                    <p style="margin:0;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:0.06em;">Security Score</p>
                    <p style="margin:8px 0 4px;font-size:48px;font-weight:700;color:${scoreColour};">${payload.score}%</p>
                    <p style="margin:0;font-size:16px;color:${scoreColour};font-weight:500;">${payload.scoreLabel}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Details -->
          <tr>
            <td style="padding:24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #2a2a2a;">
                ${payload.email ? `
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #222;font-size:13px;color:#888;width:140px;">Email</td>
                  <td style="padding:12px 0;border-bottom:1px solid #222;font-size:14px;color:#e5e5e5;font-weight:500;">${payload.email}</td>
                </tr>` : `
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #222;font-size:13px;color:#888;width:140px;">Email</td>
                  <td style="padding:12px 0;border-bottom:1px solid #222;font-size:14px;color:#555;font-style:italic;">Not provided</td>
                </tr>`}
                ${payload.sector ? `
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #222;font-size:13px;color:#888;">Sector</td>
                  <td style="padding:12px 0;border-bottom:1px solid #222;font-size:14px;color:#e5e5e5;">${payload.sector}</td>
                </tr>` : ''}
                ${payload.companySize ? `
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #222;font-size:13px;color:#888;">Company size</td>
                  <td style="padding:12px 0;border-bottom:1px solid #222;font-size:14px;color:#e5e5e5;">${payload.companySize}</td>
                </tr>` : ''}
                ${payload.worstCategory ? `
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #222;font-size:13px;color:#888;">Biggest gap</td>
                  <td style="padding:12px 0;border-bottom:1px solid #222;font-size:14px;color:#f97316;font-weight:500;">⚠️ ${payload.worstCategory}</td>
                </tr>` : ''}
                ${payload.newsletterOptIn ? `
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #222;font-size:13px;color:#888;">Newsletter</td>
                  <td style="padding:12px 0;border-bottom:1px solid #222;font-size:14px;color:#22c55e;">✓ Opted in</td>
                </tr>` : ''}
                <tr>
                  <td style="padding:12px 0;font-size:13px;color:#888;">Submitted</td>
                  <td style="padding:12px 0;font-size:14px;color:#e5e5e5;">${payload.timestamp}</td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:0 32px 28px;">
              <p style="margin:0;font-size:12px;color:#444;text-align:center;">
                Clarity by Tanosec · clarity.tanosec.co.za
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const subjectEmoji = payload.score >= 75 ? '🟢' : payload.score >= 50 ? '🟡' : payload.score >= 25 ? '🟠' : '🔴';
  const subject = `${subjectEmoji} Clarity Lead — ${payload.score}% (${payload.scoreLabel})${payload.email ? ` · ${payload.email}` : ''}`;

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
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[Clarity] Resend error:', err);
    }
  } catch (err) {
    console.error('[Clarity] Email notification failed:', err);
  }
}

// ─── Unified export ───────────────────────────────────────────────────────────

export async function notifyNewAssessment(payload: LeadNotificationPayload): Promise<void> {
  // Fire both in parallel — don't let one failure block the other
  await Promise.allSettled([
    sendWhatsAppNotification(payload),
    sendEmailNotification(payload),
  ]);
}
