
'use server';

import { NextResponse } from 'next/server';
import { addContactSubmission } from '@/lib/contacts';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400, headers: CORS_HEADERS });
    }

    // Pass the whole body object to the function
    const newSubmission = await addContactSubmission(body);

    return NextResponse.json({ message: 'Submission successful', submission: newSubmission }, { status: 201, headers: CORS_HEADERS });
  } catch (error) {
    const err = error as Error;
    console.error("Contact API Error:", err);
    return NextResponse.json({ message: err.message || 'An internal server error occurred' }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
