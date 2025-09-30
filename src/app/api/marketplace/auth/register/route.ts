
'use server';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createMarketplaceUser, type MarketplaceUserRegistrationData } from '@/lib/marketplace-users';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const customerSchema = z.object({
    userType: z.literal('Customer'),
    fullName: z.string().min(2, "Full name is required."),
    phone: z.string().min(10, "A valid 10-digit phone number is required."),
    email: z.string().email("Invalid email address.").optional().or(z.literal('')),
    password: z.string().min(6, "Password must be at least 6 characters."),
});

const dealerSchema = z.object({
    userType: z.literal('Dealer'),
    fullName: z.string().min(2, "Full name is required."),
    phone: z.string().min(10, "A valid 10-digit phone number is required."),
    email: z.string().email("A valid email is required."),
    password: z.string().min(6, "Password must be at least 6 characters."),
    dealershipName: z.string().min(2, "Dealership name is required."),
    dealershipType: z.enum(['4w', '2w', 'both'], { required_error: "Dealership type is required."}),
    city: z.string().min(2, "City is required."),
    state: z.string().min(2, "State is required."),
    pincode: z.string().min(6, "A valid 6-digit pincode is required."),
});

const registrationSchema = z.discriminatedUnion("userType", [customerSchema, dealerSchema]);


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = registrationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid input.', errors: validation.error.flatten().fieldErrors }, { status: 400, headers: CORS_HEADERS });
    }

    const userData: MarketplaceUserRegistrationData = validation.data;
    
    const newUser = await createMarketplaceUser(userData);

    return NextResponse.json({ message: 'User registered successfully', user: newUser }, { status: 201, headers: CORS_HEADERS });
  } catch (error) {
    const err = error as Error;
    console.error("Marketplace Registration API Error:", err);
    
    if (err.message.includes('already exists')) {
        return NextResponse.json({ message: err.message }, { status: 409, headers: CORS_HEADERS });
    }

    if (err instanceof SyntaxError) {
        return NextResponse.json({ message: 'Invalid JSON payload provided.' }, { status: 400, headers: CORS_HEADERS });
    }

    return NextResponse.json({ message: err.message || 'An internal server error occurred' }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
