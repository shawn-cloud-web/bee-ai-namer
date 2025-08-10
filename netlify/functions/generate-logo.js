// File: netlify/functions/generate-logo.js

const API_KEY = process.env.FIREWORKS_API_KEY; // This key should be set in Netlify
const API_URL = "https://api.fireworks.ai/inference/v1/images/generations";

exports.handler = async (event) => {
  // Only accept POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { prompt } = JSON.parse(event.body);

    if (!prompt) {
      return { statusCode: 400, body: 'Prompt is required' };
    }

    // Create a good prompt for the AI
    const fullPrompt = `vector logo of ${prompt}, minimalist, clean, graphic design, on a plain white background, high quality, studio lighting`;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "stable-diffusion-xl-1024-v1-0", // Use the updated model ID
        prompt: fullPrompt,
        n: 1, // We want to generate one image
        size: "1024x1024", // Image size
        response_format: "b64_json", // We want the image in base64 format
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Fireworks AI API error:', errorBody);
      throw new Error(`AI API failed with status: ${response.status} - ${errorBody}`);
    }

    const data = await response.json();
    const imageBase64 = data.data[0].b64_json;

    // Return the base64 image to the client
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: `data:image/png;base64,${imageBase64}` }),
    };

  } catch (error) {
    console.error('Error generating logo:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to generate logo. ' + error.message }),
    };
  }
};