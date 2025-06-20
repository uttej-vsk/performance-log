import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create a temporary path for the file
    const tempFilePath = join(tmpdir(), `upload_${Date.now()}_${file.name}`);
    
    await writeFile(tempFilePath, buffer);

    return NextResponse.json({ success: true, filePath: tempFilePath });

  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ success: false, error: 'File upload failed.' }, { status: 500 });
  }
}
