
'use server';

import { NextResponse } from 'next/server';
import { addLoanRequest } from '@/lib/loan-requests';
import { z } from 'zod';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const RequestSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "A valid phone number is required"),
  email: z.string().email("Invalid email address"),
  make: z.string().min(2, "Vehicle make is required"),
  model: z.string().min(1, "Vehicle model is required"),
  variant: z.string().optional(),
  panNumber: z.string().min(10, "A valid PAN number is required"),
  aadharNumber: z.string().min(12, "A valid Aadhar number is required"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = RequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid input.', errors: validation.error.flatten().fieldErrors }, { status: 400, headers: CORS_HEADERS });
    }
    
    const newRequest = await addLoanRequest(validation.data);

    return NextResponse.json({ message: 'Loan request submitted successfully', request: newRequest }, { status: 201, headers: CORS_HEADERS });
  } catch (error) {
    const err = error as Error;
    console.error("Loan Request API Error:", err);
    return NextResponse.json({ message: err.message || 'An internal server error occurred' }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
