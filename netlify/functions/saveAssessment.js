 // netlify/functions/saveAssessment.js
const { google } = require('googleapis');

exports.handler = async (event) => {
  // 1. Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // 2. Parse the data sent from the front-end
  const params = JSON.parse(event.body);
  const { assessmentData, score, timestamp } = params; // Your Q&A data

  try {
    // 3. Authenticate with Google Sheets using stored env vars
    const auth = new google.auth.JWT(
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      null,
      process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      ['https://www.googleapis.com/auth/spreadsheets']
    );

    const sheets = google.sheets({ version: 'v4', auth });
    // 4. Append the data as a new row
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SHEET_ID, // Your sheet ID from the URL
      range: 'Sheet1', // Change to your sheet name
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [
          [
            timestamp,
            score,
            ...assessmentData // This will spread your Q&A data into columns
          ]
        ],
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Data saved successfully!' }),
    };
  } catch (error) {
    return { statusCode: 500, body: error.toString() };
  }
};
