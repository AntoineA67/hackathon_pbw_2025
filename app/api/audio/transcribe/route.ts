import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Check file size
    if (file.size === 0) {
      return NextResponse.json({ error: 'Empty audio file' }, { status: 400 });
    }

    // Check file type
    const allowedTypes = ['audio/m4a', 'audio/webm', 'audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/mpga'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported audio format' }, 
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Log file info for debugging
    console.log('File info:', {
      name: file.name,
      type: file.type,
      size: file.size,
      bufferLength: buffer.length
    });

    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: "whisper-1",
      response_format: "verbose_json",
      language: "en"
    });

    if (!transcription.text) {
      return NextResponse.json(
        { error: 'No transcription generated' },
        { status: 500 }
      );
    }

    return NextResponse.json({ text: transcription.text });
  } catch (error) {
    console.error('Error processing audio:', error);
    return NextResponse.json(
      { error: 'Failed to process audio' },
      { status: 500 }
    );
  }
} 