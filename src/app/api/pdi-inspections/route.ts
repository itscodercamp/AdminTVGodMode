
'use server';

import { NextResponse } from 'next/server';
import { addPDIInspection } from '@/lib/pdi-inspections';
import { z } from 'zod';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const PDISchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "A valid phone number is required"),
  email: z.string().email("Invalid email address"),
  city: z.string().min(2, "City is required"),
  make: z.string().min(2, "Vehicle make is required"),
  model: z.string().min(1, "Vehicle model is required"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = PDISchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid input.', errors: validation.error.flatten().fieldErrors }, { status: 400, headers: CORS_HEADERS });
    }
    
    const newInspection = await addPDIInspection(validation.data);

    return NextResponse.json({ message: 'PDI inspection request submitted successfully', inspection: newInspection }, { status: 201, headers: CORS_HEADERS });
  } catch (error) {
    const err = error as Error;
    console.error("PDI Inspection API Error:", err);
    return NextResponse.json({ message: err.message || 'An internal server error occurred' }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
