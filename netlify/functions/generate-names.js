// netlify/functions/generate-names.js

const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { prompt } = JSON.parse(event.body);
    const apiKey = process.env.GEMINI_API_KEY; // Securely access the API key

    if (!apiKey) {
      throw new Error('API key is not set.');
    }

    // This is the prompt we will send to the AI.
    // It's engineered to give back a list of names and taglines.
    const fullPrompt = `Generate a list of 4 creative, brandable startup names and a short, catchy tagline for each one based on this description: "${prompt}".

    Return the list in a "Name: Tagline" format, with each on a new line. For example:
    NovaReach: Expanding your digital horizons.
    ZenithCore: The peak of performance technology.
    PulseWave: The rhythm of innovation.
    IgniteHub: Sparking brilliant connections.`;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: fullPrompt
          }]
        }]
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API call failed with status ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates[0].content.parts[0].text;

    return {
      statusCode: 200,
      body: JSON.stringify({ names: aiResponse }),
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};