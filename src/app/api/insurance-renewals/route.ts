
'use server';

import { NextResponse } from 'next/server';
import { addInsuranceRenewal } from '@/lib/insurance-renewals';
import { z } from 'zod';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const RenewalSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "A valid phone number is required"),
  registrationNumber: z.string().min(3, "Registration number is required"),
  insuranceType: z.string().min(2, "Insurance type is required"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = RenewalSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid input.', errors: validation.error.flatten().fieldErrors }, { status: 400, headers: CORS_HEADERS });
    }
    
    const newRenewal = await addInsuranceRenewal(validation.data);

    return NextResponse.json({ message: 'Insurance renewal request submitted successfully', renewal: newRenewal }, { status: 201, headers: CORS_HEADERS });
  } catch (error) {
    const err = error as Error;
    console.error("Insurance Renewal API Error:", err);
    return NextResponse.json({ message: err.message || 'An internal server error occurred' }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
