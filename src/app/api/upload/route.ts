
// src/app/api/upload/route.ts
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;
    const destination: string = data.get('destination') as string || 'uploads';

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file found' }, { status: 400 });
    }

    // --- File Saving Logic ---
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Define the path where the file will be saved.
    // Sanitize destination to prevent path traversal attacks
    const sanitizedDestination = path.normalize(destination).replace(/^(\.\.(\/|\\|$))+/, '');
    const uploadDir = path.join(process.cwd(), 'public', sanitizedDestination);
    
    // Ensure the uploads directory exists
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      const nodeError = error as NodeJS.ErrnoException;
      // Ignore EEXIST error, which means the directory already exists.
      if (nodeError.code !== 'EEXIST') {
        console.error('Error creating directory:', nodeError);
        throw new Error('Could not create upload directory on the server.');
      }
    }
    
    // Create a unique filename to avoid overwrites
    const filename = `${Date.now()}-${file.name}`;
    const fullPath = path.join(uploadDir, filename);

    // Write the file to the filesystem.
    await writeFile(fullPath, buffer);
    console.log(`File saved to: ${fullPath}`);

    // Create the public URL path for the saved file.
    const publicPath = `/${sanitizedDestination}/${filename}`;

    return NextResponse.json({ success: true, path: publicPath });

  } catch (error) {
    const err = error as Error;
    console.error('File Upload Error:', err);
    return NextResponse.json({ success: false, message: err.message || 'Something went wrong' }, { status: 500 });
  }
}
