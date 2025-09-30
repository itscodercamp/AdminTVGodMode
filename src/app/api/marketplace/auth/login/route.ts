
'use server';

import { NextResponse } from 'next/server';
import { findMarketplaceUserByPhone, verifyPassword } from '@/lib/marketplace-users';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, password } = body;

    if (!phone || !password) {
      return NextResponse.json({ message: 'Phone number and password are required' }, { status: 400, headers: CORS_HEADERS });
    }

    const user = await findMarketplaceUserByPhone(phone);

    if (!user) {
      return NextResponse.json({ message: 'Invalid phone number or password' }, { status: 401, headers: CORS_HEADERS });
    }

    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
        return NextResponse.json({ message: 'Invalid phone number or password' }, { status: 401, headers: CORS_HEADERS });
    }

    // Don't send the password back to the client
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({ message: 'Login successful', user: userWithoutPassword }, { status: 200, headers: CORS_HEADERS });
  } catch (error) {
    const err = error as Error;
    console.error("Marketplace Login API Error:", err);
    return NextResponse.json({ message: err.message || 'An internal server error occurred' }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
