import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    // Create a unique filename based on the text content
    const filename = `speech-${Date.now()}.mp3`;
    const publicPath = path.join(process.cwd(), 'public', 'audio', filename);
    const publicUrl = `/audio/${filename}`;

    console.log('Creating audio file at:', publicPath);

    // Ensure the audio directory exists
    const audioDir = path.join(process.cwd(), 'public', 'audio');
    if (!fs.existsSync(audioDir)) {
      console.log('Creating audio directory:', audioDir);
      fs.mkdirSync(audioDir, { recursive: true });
    }

    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: text,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    await fs.promises.writeFile(publicPath, buffer);
    console.log('Audio file created successfully');
    
    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error('Error in text-to-speech:', error);
    return NextResponse.json({ error: 'Failed to convert text to speech' }, { status: 500 });
  }
} 