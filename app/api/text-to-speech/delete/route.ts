import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { filename } = await request.json();
    console.log('Attempting to delete file:', filename);
    
    const filePath = path.join(process.cwd(), 'public', 'audio', filename);
    console.log('Full file path:', filePath);
    
    if (fs.existsSync(filePath)) {
      console.log('File exists, attempting to delete...');
      await fs.promises.unlink(filePath);
      console.log('File deleted successfully');
    } else {
      console.log('File does not exist at path:', filePath);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting audio file:', error);
    return NextResponse.json({ error: 'Failed to delete audio file' }, { status: 500 });
  }
} 