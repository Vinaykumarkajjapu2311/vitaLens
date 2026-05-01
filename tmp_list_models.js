require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function check() {
  const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY || "AIzaSyDHffI-QcBXTfykEL1OgAUFY9YI4ihxq_I");
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
  } catch (e) {
    console.error(e);
  }
}

check();
