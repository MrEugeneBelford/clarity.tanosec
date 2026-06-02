// netlify/functions/saveAssessment.js
const questions = require('../../src/lib/questions-manifest.json');
const { sendNotification } = require('../../src/lib/notifications');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const payload = JSON.parse(event.body);

    // Flexible data extraction to handle key mismatches cleanly
    const contactInfo = payload.contactInfo || payload.user || {};
    const userAnswers = payload.answers || payload.responses || {};
    const score = payload.score !== undefined ? payload.score : '—';
    const maxScore = payload.maxScore || '100';

    let answersReport = "\n=== ASSESSMENT DATA MATRIX ===\n";

    // Handle either destructured property or root array ingestion
    const targetQuestions = Array.isArray(questions) ? questions : (questions.questions || []);

    if (targetQuestions.length === 0) {
      answersReport += "[!] Diagnostic Warning: Question manifest array is empty or unreadable.\n";
    } else {
      targetQuestions.forEach((q, index) => {
        // Look up user's submitted token using the unique question ID
        const selectedChoiceToken = userAnswers[q.id];
        let chosenAnswerText = "Not Answered / Skipped";

        if (selectedChoiceToken !== undefined && q.options) {
          // Look up the exact matching text string inside the nested options array
          const matchedOption = q.options.find(opt =>
            String(opt.id) === String(selectedChoiceToken) ||
            String(opt.value) === String(selectedChoiceToken) ||
            String(opt.text) === String(selectedChoiceToken)
          );

          if (matchedOption) {
            chosenAnswerText = matchedOption.text || matchedOption.value;
          } else {
            // Fallback: print raw value if a structural option index mismatch occurs
            chosenAnswerText = `Raw Selection: ${selectedChoiceToken}`;
          }
        }

        answersReport += `\nQ${index + 1}: ${q.text || 'Question Text Missing'}\n   Selected Option -> ${chosenAnswerText}\n`;
      });
    }

    answersReport += "\n=============================\n";

    // Clean, direct layout format with zero lobster/extraneous emojis
    const notificationBody = `
🛡️ Clarity Assessment Report Submitted

[+] CLIENT INFORMATION:
- Name: ${contactInfo.name || 'Not Disclosed'}
- Business: ${contactInfo.company || 'Not Disclosed'}
- Email: ${contactInfo.email || 'Not Disclosed'}
- Phone: ${contactInfo.phone || 'Not Disclosed'}

[+] METRIC METERS:
- Aggregated Score: ${score} / ${maxScore}

${answersReport}
    `;

    // Fire text payload to notification stream
    await sendNotification({
      subject: `🛡️ Clarity Snapshot: ${contactInfo.company || contactInfo.name || 'New Lead'}`,
      text: notificationBody,
      data: { ...payload, formattedAnswers: answersReport }
    });

    // Main database ingestion hooks remain safe beneath this line
    // ... (Your database storage logic here) ...

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "Telemetry matrix compiled successfully." })
    };

  } catch (error) {
    console.error("Clarity Core Intake Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Intake validation pipeline failure." })
    };
  }
};