
'use server';

import { NextResponse } from 'next/server';
import { addSellCarRequest } from '@/lib/sell-requests';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Basic validation to ensure required fields are present
    const requiredFields = ['make', 'model', 'year', 'sellerName', 'phone'];
    for (const field of requiredFields) {
        if (!body[field]) {
            return NextResponse.json({ message: `Missing required field: ${field}` }, { status: 400, headers: CORS_HEADERS });
        }
    }

    const newRequest = await addSellCarRequest(body);

    return NextResponse.json({ message: 'Sell car request submitted successfully', request: newRequest }, { status: 201, headers: CORS_HEADERS });
  } catch (error) {
    const err = error as Error;
    console.error("Sell Car Request API Error:", err);
    return NextResponse.json({ message: err.message || 'An internal server error occurred' }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
