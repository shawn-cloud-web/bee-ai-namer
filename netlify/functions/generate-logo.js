// File: netlify/functions/generate-logo.js

const API_KEY = process.env.FIREWORKS_API_KEY; // আমরা এই কী Netlify-তে সেট করব
const API_URL = "https://api.fireworks.ai/inference/v1/images/generations";

exports.handler = async (event) => {
  // শুধুমাত্র POST অনুরোধ গ্রহণ করুন
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { prompt } = JSON.parse(event.body);

    if (!prompt) {
      return { statusCode: 400, body: 'Prompt is required' };
    }

    // AI-কে দেওয়ার জন্য একটি ভালো প্রম্পট তৈরি করুন
    const fullPrompt = `vector logo of ${prompt}, minimalist, clean, graphic design, on a plain white background, high quality, studio lighting`;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "stability/stable-diffusion-xl-1024-v1-0",
        prompt: fullPrompt,
        n: 1, // আমরা একটি ছবি তৈরি করব
        size: "1024x1024", // ছবির সাইজ
        response_format: "b64_json", // আমরা base64 ফরম্যাটে ছবি চাই
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Fireworks AI API error:', errorBody);
      throw new Error(`AI API failed with status: ${response.status}`);
    }

    const data = await response.json();
    const imageBase64 = data.data[0].b64_json;

    // Base64 ইমেজটি ক্লায়েন্টকে ফেরত পাঠান
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