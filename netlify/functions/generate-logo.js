// এই ফাইলটা এই জায়গায় রাখুন: netlify/functions/generate-logo.js

const API_KEY = process.env.FIREWORKS_API_KEY || 'fw_3ZJ9huy4CtbqPnCTR5ytxTrx';

exports.handler = async (event, context) => {
  // CORS headers - এটা ব্রাউজার এবং সার্ভারের মধ্যে যোগাযোগের জন্য দরকার
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // OPTIONS request handle করা (এটা ব্রাউজার নিজে নিজে পাঠায়)
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // শুধুমাত্র POST request গ্রহণ করব
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers,
      body: JSON.stringify({ error: 'শুধুমাত্র POST method allowed' })
    };
  }

  console.log('ফাংশন শুরু হয়েছে, API key আছে কি?', !!API_KEY);

  try {
    // ইউজারের পাঠানো ডেটা পার্স করা
    const { prompt } = JSON.parse(event.body);

    if (!prompt) {
      return { 
        statusCode: 400, 
        headers,
        body: JSON.stringify({ error: 'প্রম্পট দিতে হবে' })
      };
    }

    console.log('লোগো তৈরি করা হচ্ছে:', prompt);

    // AI এর জন্য ভালো প্রম্পট তৈরি করা
    const aiPrompt = `Professional logo design: ${prompt}. Minimalist, clean, modern vector graphic. Simple geometric shapes, business branding style. Plain white background. High quality logo.`;

    // Fireworks AI এর সঠিক URL
    const API_URL = "https://api.fireworks.ai/inference/v1/image_generation/accounts/fireworks/models/flux-1-schnell";

    console.log('API তে request পাঠানো হচ্ছে...');

    // API কল করা
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        prompt: aiPrompt,
        width: 512,
        height: 512,
        steps: 4,
        guidance_scale: 1.0,
        seed: Math.floor(Math.random() * 100000),
        safety_check: false,
        output_image_format: "PNG"
      }),
    });

    console.log('API response status:', response.status);

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('API error:', response.status, responseText);
      
      // যদি প্রথম API fail করে, দ্বিতীয় API try করি
      console.log('বিকল্প API try করা হচ্ছে...');
      
      const fallbackURL = "https://api.fireworks.ai/inference/v1/image_generation/accounts/fireworks/models/stable-diffusion-xl-1024-v1-0";
      
      const fallbackResponse = await fetch(fallbackURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          prompt: aiPrompt,
          width: 512,
          height: 512,
          steps: 20,
          guidance_scale: 7.5,
          seed: Math.floor(Math.random() * 100000),
          safety_check: false,
          output_image_format: "PNG"
        }),
      });

      const fallbackText = await fallbackResponse.text();
      
      if (!fallbackResponse.ok) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ 
            error: `উভয় API fail হয়েছে। Error: ${responseText}`,
            details: 'API key বা credit সমস্যা হতে পারে'
          })
        };
      }

      // বিকল্প API সফল হলে
      const fallbackData = JSON.parse(fallbackText);
      if (fallbackData && fallbackData.image) {
        const imageData = fallbackData.image.startsWith('data:') ? 
          fallbackData.image : 
          `data:image/png;base64,${fallbackData.image}`;

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ image: imageData }),
        };
      }
    }

    // প্রধান API সফল হলে
    const data = JSON.parse(responseText);
    console.log('সফল! Image পাওয়া গেছে');

    let imageData;
    if (data.image) {
      imageData = data.image.startsWith('data:') ? 
        data.image : 
        `data:image/png;base64,${data.image}`;
    } else {
      throw new Error('API response এ image পাওয়া যায়নি');
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ image: imageData }),
    };

  } catch (error) {
    console.error('ফাংশনে error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'সার্ভার error: ' + error.message,
        help: 'Netlify logs চেক করুন'
      }),
    };
  }
};