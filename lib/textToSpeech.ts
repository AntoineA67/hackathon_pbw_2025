import fs from "fs";
import path from "path";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function textToSpeech(text: string, outputPath: string = "./speech.wav") {
  try {
    const speechFile = path.resolve(outputPath);
    
    const wav = await groq.audio.speech.create({
      model: "playai-tts",
      voice: "Aaliyah-PlayAI",
      response_format: "wav",
      input: text,
    });

    const buffer = Buffer.from(await wav.arrayBuffer());
    await fs.promises.writeFile(speechFile, buffer);
    
    return speechFile;
  } catch (error) {
    console.error("Error in textToSpeech:", error);
    throw error;
  }
} 