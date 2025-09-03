// netlify/functions/saveAssessment.js
// No-op save handler: validates method and body, returns success without external dependencies.

exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const params = event.body ? JSON.parse(event.body) : {};
    const { assessmentData, score, timestamp } = params;

    if (!assessmentData || typeof score === 'undefined' || !timestamp) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required fields' }),
      };
    }

    // In this cleaned version, we skip external persistence.
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
