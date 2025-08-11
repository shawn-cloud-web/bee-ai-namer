// এই ফাইলটি আপনার প্রজেক্টের এই ফোল্ডারে রাখুন: netlify/functions/generate-logo.js

// fetch ফাংশন import করা হচ্ছে
const fetch = require('node-fetch');

// Netlify তে সেট করা আপনার API KEY এখানে লোড হবে
const API_KEY = process.env.FIREWORKS_API_KEY;

exports.handler = async (event) => {
  // CORS headers - এটা ব্রাউজার এবং সার্ভারের মধ্যে যোগাযোগের জন্য দরকার
  const headers = {
    'Access-Control-Allow-Origin': '*', // যেকোনো ওয়েবসাইট থেকে অ্যাক্সেসের অনুমতি দেয়
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // ব্রাউজার থেকে পাঠানো OPTIONS রিকোয়েস্ট হ্যান্ডেল করার জন্য
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'OPTIONS request handled' }),
    };
  }

  // শুধুমাত্র POST রিকোয়েস্ট গ্রহণ করা হবে
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'শুধুমাত্র POST method ব্যবহার করুন' }),
    };
  }

  // API Key সেট করা আছে কিনা তা চেক করা
  if (!API_KEY) {
    console.error('Fireworks API Key সেট করা নেই।');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'সার্ভার কনফিগারেশনে সমস্যা। API Key পাওয়া যায়নি।' }),
    };
  }

  try {
    const { prompt } = JSON.parse(event.body);

    if (!prompt) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'লোগোর জন্য একটি বর্ণনা দিন।' }),
      };
    }

    // AI এর জন্য একটি ভালো প্রম্পট তৈরি করা
    const aiPrompt = `A professional logo for "${prompt}". Minimalist, clean, modern vector graphic. Simple geometric shapes, suitable for business branding. On a plain white background. High quality, clear design.`;

    // Fireworks AI এর সঠিক এবং বর্তমানে কার্যকর মডেলের URL
    const API_URL = "https://api.fireworks.ai/inference/v1/image_generation/accounts/fireworks/models/stable-diffusion-xl-1024-v1-0";

    console.log('API তে রিকোয়েস্ট পাঠানো হচ্ছে:', API_URL);

    // Fireworks AI কে লোগো তৈরির জন্য রিকোয়েস্ট পাঠানো
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'image/png', // আমরা সরাসরি ইমেজ ফাইল চাই
      },
      body: JSON.stringify({
        prompt: aiPrompt,
        height: 512,
        width: 512,
        steps: 30, // ভালো কোয়ালিটির জন্য স্টেপস বাড়ানো হয়েছে
        guidance_scale: 7,
        seed: Math.floor(Math.random() * 1000000),
        safety_check: false,
        output_image_format: "PNG",
      }),
    });

    // যদি API থেকে রেসপন্স সফল না হয়
    if (!response.ok) {
      const errorBody = await response.text();
      console.error('API Error:', response.status, errorBody);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: `AI মডেল থেকে ছবি তৈরি করা যায়নি। Error: ${errorBody}` }),
      };
    }

    // API থেকে পাওয়া ইমেজকে Base64 ফরম্যাটে কনভার্ট করা
    const imageBuffer = await response.buffer();
    const base64Image = imageBuffer.toString('base64');
    const imageDataUrl = `data:image/png;base64,${base64Image}`;

    console.log('সফলভাবে ইমেজ তৈরি হয়েছে!');

    // ব্রাউজারে ইমেজ ডেটা পাঠানো
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ image: imageDataUrl }),
    };

  } catch (error) {
    console.error('Netlify Function এ একটি বড় সমস্যা হয়েছে:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'সার্ভারে একটি অপ্রত্যাশিত সমস্যা হয়েছে: ' + error.message }),
    };
  }
};
