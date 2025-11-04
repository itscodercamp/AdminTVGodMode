
'use server';

import { NextResponse } from 'next/server';
import { addMarketplaceInquiry } from '@/lib/marketplace-inquiries';
import { z } from 'zod';


const InquirySchema = z.object({
  vehicleId: z.string().uuid("Invalid Vehicle ID format"),
  userId: z.string().uuid("Invalid User ID format"),
});


const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = InquirySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid input.', errors: validation.error.flatten().fieldErrors }, { status: 400, headers: CORS_HEADERS });
    }
    
    const newInquiry = await addMarketplaceInquiry(validation.data);

    return NextResponse.json({ message: 'Marketplace inquiry submitted successfully', inquiry: newInquiry }, { status: 201, headers: CORS_HEADERS });
  } catch (error) {
    const err = error as Error;
    console.error("Marketplace Inquiry API Error:", err);
    
    if (err.message.includes('not found')) {
        return NextResponse.json({ message: err.message }, { status: 404, headers: CORS_HEADERS });
    }
    if (err instanceof SyntaxError) {
        return NextResponse.json({ message: 'Invalid JSON payload provided.' }, { status: 400, headers: CORS_HEADERS });
    }

    return NextResponse.json({ message: err.message || 'An internal server error occurred' }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
