require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function check() {
  const preferredModels = [
    'gemini-flash-latest',
    'gemini-2.5-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-pro',
  ];

  const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY || '');

  if (!process.env.EXPO_PUBLIC_GEMINI_API_KEY) {
    console.error('Missing EXPO_PUBLIC_GEMINI_API_KEY');
    return;
  }

  try {
    const fetch = require('node-fetch');
    // Using fetch directly to hit models endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.EXPO_PUBLIC_GEMINI_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    console.log("AVAILABLE MODELS:");
    data.models?.forEach(m => {
      console.log(`- ${m.name} (supports: ${m.supportedGenerationMethods.join(', ')})`);
    });
    console.log('\nPREFERRED FALLBACK ORDER:');
    preferredModels.forEach((m) => console.log(`- ${m}`));
  } catch (e) {
    console.error(e);
  }
}

check();
