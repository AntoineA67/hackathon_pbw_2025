import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    // Create a unique filename based on the text content
    const filename = `speech-${Date.now()}.wav`;
    const publicPath = path.join(process.cwd(), 'public', 'audio', filename);
    const publicUrl = `/audio/${filename}`;

    console.log('Creating audio file at:', publicPath);

    // Ensure the audio directory exists
    const audioDir = path.join(process.cwd(), 'public', 'audio');
    if (!fs.existsSync(audioDir)) {
      console.log('Creating audio directory:', audioDir);
      fs.mkdirSync(audioDir, { recursive: true });
    }
    
    const wav = await groq.audio.speech.create({
      model: "playai-tts",
      voice: "Aaliyah-PlayAI",
      response_format: "wav",
      input: text,
    });

    const buffer = Buffer.from(await wav.arrayBuffer());
    await fs.promises.writeFile(publicPath, buffer);
    console.log('Audio file created successfully');
    
    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error('Error in text-to-speech:', error);
    return NextResponse.json({ error: 'Failed to convert text to speech' }, { status: 500 });
  }
} 