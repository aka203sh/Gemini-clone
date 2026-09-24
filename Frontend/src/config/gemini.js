// import {
//   GoogleGenerativeAI,
//   HarmCategory,
//   HarmBlockThreshold,
// } from "@google/generative-ai";

// const MODEL_NAME = "gemini-3.5-flash";
// const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// async function runChat(prompt, history = []) {
//   const genAI = new GoogleGenerativeAI(API_KEY);
//   const model = genAI.getGenerativeModel({ model: MODEL_NAME });

//   const generationConfig = {
//     temperature: 0.9,
//     topK: 1,
//     topP: 1,
//     maxOutputTokens: 2048,
//   };

//   const safetySettings = [
//     { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
//     { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
//     { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
//     { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
//   ];

//   try {
//     const chat = model.startChat({ generationConfig, safetySettings, history });
//     const result = await chat.sendMessage(prompt);
//     const response = result.response;
//     return response.text();
//   } catch (err) {
//     console.error("Gemini API error:", err);
//     throw err;
//   }
// }

// export default runChat;

import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

const MODEL_NAME = "gemini-3.5-flash";
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

const generationConfig = {
  temperature: 0.9,
  topK: 1,
  topP: 1,
  maxOutputTokens: 8192,
};

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

// export function createChatSession() {
//   return model.startChat({ generationConfig, safetySettings, history: [] });
// }
export function createChatSession(history = []) {
  return model.startChat({ generationConfig, safetySettings, history });
}


export async function sendMessage(chatSession, prompt, imageData = null) {
  try {
    let messageParts;
    if (imageData) {
      messageParts = [
        { text: prompt },
        { inlineData: { mimeType: imageData.mimeType, data: imageData.base64 } }
      ];
    } else {
      messageParts = prompt;
    }
    const result = await chatSession.sendMessage(messageParts);
    return result.response.text();
  } catch (err) {
    console.error("Gemini API error:", err);
    throw err;
  }
}