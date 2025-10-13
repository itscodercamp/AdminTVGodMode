
import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const filePath = params.path.join('/');
    
    // Sanitize the file path to prevent directory traversal
    const sanitizedFilePath = path.normalize(filePath).replace(/^(\.\.[\/\\])+/, '');
    const fullPath = path.join(process.cwd(), 'public', sanitizedFilePath);

    if (!existsSync(fullPath)) {
        return NextResponse.json({ error: 'File not found' }, { status: 404, headers: CORS_HEADERS });
    }
    
    const fileBuffer = await readFile(fullPath);
    const ext = path.extname(fullPath).toLowerCase();
    
    const contentTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
    };
    
    const headers = {
        ...CORS_HEADERS,
        'Content-Type': contentTypes[ext] || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
    };

    return new NextResponse(fileBuffer, { headers });
  } catch (error) {
    console.error("Image serving error:", error);
    return NextResponse.json({ error: 'File not found or could not be read' }, { status: 404, headers: CORS_HEADERS });
  }
}

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
