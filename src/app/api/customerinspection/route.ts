
'use server';

import { NextResponse } from 'next/server';
import { addWebsiteInspection } from '@/lib/website-inspections';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const requiredFields = ['fullName', 'phoneNumber', 'carMake', 'carModel'];
    for (const field of requiredFields) {
        if (!body[field]) {
            return NextResponse.json({ message: `Missing required field: ${field}` }, { status: 400, headers: CORS_HEADERS });
        }
    }

    // Pass the entire body object directly to the function
    const newRequest = await addWebsiteInspection(body);

    return NextResponse.json({ message: 'Website inspection request submitted successfully', request: newRequest }, { status: 201, headers: CORS_HEADERS });
  } catch (error) {
    const err = error as Error;
    console.error("Customer Inspection API Error:", err);
    return NextResponse.json({ message: err.message || 'An internal server error occurred' }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
