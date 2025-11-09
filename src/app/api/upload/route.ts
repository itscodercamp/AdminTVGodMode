
// src/app/api/upload/route.ts
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// Use environment variable for the base uploads directory name.
const UPLOADS_DIR_NAME = process.env.UPLOADS_DIR || 'public';


export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;
    // Destination is a sub-directory within the main uploads directory
    const destination: string = data.get('destination') as string || 'uploads';

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file found' }, { status: 400 });
    }

    // --- File Validation ---
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ success: false, message: `File type not allowed. Received: ${file.type}` }, { status: 400 });
    }

    // --- File Saving Logic ---
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize destination to prevent path traversal attacks
    const sanitizedDestination = path.normalize(destination).replace(/^(\.\.(\/|\\|$))+/, '');
    
    // The full directory path for saving the file
    const uploadDir = path.join(process.cwd(), UPLOADS_DIR_NAME, sanitizedDestination);
    
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
    
    // Create a unique filename with the original extension
    const fileExtension = path.extname(file.name);
    const baseFilename = path.basename(file.name, fileExtension);
    const filename = `${Date.now()}-${baseFilename}${fileExtension}`;
    const fullPath = path.join(uploadDir, filename);

    // Write the file to the filesystem.
    await writeFile(fullPath, buffer);
    console.log(`File saved to: ${fullPath}`);

    // Create the public URL path for the saved file.
    // This path is relative to the `public` directory.
    const publicPath = `/${sanitizedDestination}/${filename}`;

    return NextResponse.json({ success: true, path: publicPath });

  } catch (error) {
    const err = error as Error;
    console.error('File Upload Error:', err);
    return NextResponse.json({ success: false, message: err.message || 'Something went wrong' }, { status: 500 });
  }
}
