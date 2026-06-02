// netlify/functions/saveAssessment.js
const { questions } = require('../../src/lib/questions');

// Helper to send notifications via email and WhatsApp
async function sendNotification({ text, contactInfo, score, maxScore }) {
  console.log('[saveAssessment] sendNotification invoked');

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
        console.error('[saveAssessment] Whapi error:', await response.text());
      } else {
        console.log('[saveAssessment] WhatsApp notification sent');
      }
    } catch (err) {
      console.error('[saveAssessment] WhatsApp failed:', err);
    }
  }

  // 2. Email via Resend
  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.NOTIFICATION_EMAIL_TO;
  const fromEmail = process.env.NOTIFICATION_EMAIL_FROM;
  if (apiKey && toEmail && fromEmail) {
    try {
      const emoji = score >= 75 ? '🟢' : score >= 50 ? '🟡' : score >= 25 ? '🟠' : '🔴';
      const subject = `${emoji} Clarity Assessment Q&A Breakdown — ${score}/${maxScore}${contactInfo ? ` · ${contactInfo}` : ''}`;
      
      const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0f0f0f;font-family:Arial,sans-serif;color:#e5e5e5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td>
      <table width="600" align="center" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:12px;border:1px solid #2a2a2a;max-width:600px;width:100%;">
        <tr><td style="padding:24px 32px;border-bottom:1px solid #2a2a2a;">
          <p style="margin:0;font-size:13px;color:#666;text-transform:uppercase;letter-spacing:0.08em;">Tanosec Cybersecurity</p>
          <h1 style="margin:4px 0 0;font-size:22px;color:#fff;">🦞 Detailed Q&A Report</h1>
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
          subject,
          html,
        }),
      });
      if (!response.ok) {
        console.error('[saveAssessment] Resend error:', await response.text());
      } else {
        console.log('[saveAssessment] Email notification sent');
      }
    } catch (err) {
      console.error('[saveAssessment] Email failed:', err);
    }
  }
}

exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const params = event.body ? JSON.parse(event.body) : {};
    const { contactInfo, answers, score, maxScore } = params;

    if (!answers || typeof score === 'undefined' || typeof maxScore === 'undefined') {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required fields' }),
      };
    }

    // Initialize answersReport string
    let answersReport = '\n========================================\nDETAILED ASSESSMENT Q&A REPORT\n========================================\n';

    // Loop through the master 'questions' array
    questions.forEach((q, index) => {
      const qNum = index + 1;
      const selectedToken = answers[q.id];
      let literalAnswer = 'Not Answered';

      if (selectedToken !== undefined && selectedToken !== null) {
        let option = null;
        if (typeof selectedToken === 'number' || !isNaN(selectedToken)) {
          const idx = parseInt(selectedToken, 10);
          if (q.options && q.options[idx]) {
            option = q.options[idx];
          }
        }
        if (!option && q.options) {
          option = q.options.find(opt => opt.text === selectedToken);
        }
        if (!option && q.industryOptions) {
          for (const sectorOpts of Object.values(q.industryOptions)) {
            if (typeof selectedToken === 'number' || !isNaN(selectedToken)) {
              const idx = parseInt(selectedToken, 10);
              if (sectorOpts[idx]) {
                option = sectorOpts[idx];
                break;
              }
            }
            option = sectorOpts.find(opt => opt.text === selectedToken);
            if (option) break;
          }
        }

        if (option) {
          literalAnswer = option.text;
        } else {
          literalAnswer = String(selectedToken);
        }
      }

      answersReport += `Q${qNum}: ${q.text} -> Chosen Answer: ${literalAnswer}\n`;
    });

    const emoji = score >= 75 ? '🟢' : score >= 50 ? '🟡' : score >= 25 ? '🟠' : '🔴';
    const textNotification = [
      `🦞 *New Clarity Assessment Q&A breakdown*`,
      ``,
      `${emoji} *Score:* ${score}/${maxScore}`,
      contactInfo ? `📧 *Contact:* ${contactInfo}` : `📧 *Contact:* Not provided`,
      ``,
      answersReport,
    ].join('\n');

    // Concatenate this completed 'answersReport' data block directly into the 'text' or body payload passed into sendNotification()
    await sendNotification({
      text: textNotification,
      contactInfo,
      score,
      maxScore
    });

    // Return a success response to the client.
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Received assessment payload', ok: true }),
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (error) {
    return { statusCode: 400, body: JSON.stringify({ message: 'Invalid JSON payload' }) };
  }
};
