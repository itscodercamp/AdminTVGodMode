
'use server';

import { NextResponse } from 'next/server';
import { addMarketplaceContact } from '@/lib/marketplace-contact';
import { z } from 'zod';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const MarketplaceContactSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  message: z.string().min(10, "Message must be at least 10 characters long"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = MarketplaceContactSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid input.', errors: validation.error.flatten().fieldErrors }, { status: 400, headers: CORS_HEADERS });
    }
    
    const newContact = await addMarketplaceContact(validation.data);

    return NextResponse.json({ message: 'Marketplace contact message submitted successfully', contact: newContact }, { status: 201, headers: CORS_HEADERS });
  } catch (error) {
    const err = error as Error;
    console.error("Marketplace Contact API Error:", err);
    
    if (err instanceof SyntaxError) {
        return NextResponse.json({ message: 'Invalid JSON payload provided.' }, { status: 400, headers: CORS_HEADERS });
    }

    return NextResponse.json({ message: err.message || 'An internal server error occurred' }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
