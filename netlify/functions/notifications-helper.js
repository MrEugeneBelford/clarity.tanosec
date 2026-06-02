// netlify/functions/notifications-helper.js

async function sendNotification({ subject, text, data }) {
  console.log('[notifications-helper] sendNotification invoked');

  // 1. WhatsApp via Whapi
  const token = process.env.WHAPI_TOKEN;
  const toNumber = process.env.WHAPI_TO_NUMBER;
  if (token && toNumber) {
    try {
      const response = await fetch('https://gate.whapi.cloud/messages/text', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to: toNumber, body: text }),
      });
      if (!response.ok) {
        console.error('[notifications-helper] Whapi error:', await response.text());
      } else {
        console.log('[notifications-helper] WhatsApp notification sent');
      }
    } catch (err) {
      console.error('[notifications-helper] WhatsApp failed:', err);
    }
  }

  // 2. Email via Resend
  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.NOTIFICATION_EMAIL_TO;
  const fromEmail = process.env.NOTIFICATION_EMAIL_FROM;
  if (apiKey && toEmail && fromEmail) {
    try {
      const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0f0f0f;font-family:Arial,sans-serif;color:#e5e5e5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td>
      <table width="600" align="center" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:12px;border:1px solid #2a2a2a;max-width:600px;width:100%;">
        <tr><td style="padding:24px 32px;border-bottom:1px solid #2a2a2a;">
          <p style="margin:0;font-size:13px;color:#666;text-transform:uppercase;letter-spacing:0.08em;">Tanosec Cybersecurity</p>
          <h1 style="margin:4px 0 0;font-size:22px;color:#fff;">🛡️ Clarity Assessment Report</h1>
        </td></tr>
        <tr><td style="padding:24px 32px;">
          <p style="margin:0 0 16px;font-size:14px;color:#e5e5e5;white-space:pre-wrap;line-height:1.6;">${text}</p>
        </td></tr>
        <tr><td style="padding:0 32px 28px;"><p style="margin:0;font-size:12px;color:#444;text-align:center;">Clarity by Tanosec · clarity.tanosec.co.za</p></td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [toEmail],
          subject: subject || '🛡️ Clarity Assessment Report',
          html,
        }),
      });
      if (!response.ok) {
        console.error('[notifications-helper] Resend error:', await response.text());
      } else {
        console.log('[notifications-helper] Email notification sent');
      }
    } catch (err) {
      console.error('[notifications-helper] Email failed:', err);
    }
  }
}

module.exports = {
  sendNotification,
};
