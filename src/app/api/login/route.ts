
'use server';

import { NextResponse } from 'next/server';
import { findUserByEmail } from '@/lib/users';
import bcrypt from 'bcryptjs';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400, headers: CORS_HEADERS });
    }

    const user = await findUserByEmail(email);

    if (!user || !user.password) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401, headers: CORS_HEADERS });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401, headers: CORS_HEADERS });
    }
    
    if (user.status === 'Inactive') {
        return NextResponse.json({ message: 'Your account is inactive. Please contact admin.' }, { status: 403, headers: CORS_HEADERS });
    }

    // Don't send the password back to the client
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({ message: 'Login successful', user: userWithoutPassword }, { status: 200, headers: CORS_HEADERS });
  } catch (error) {
    const err = error as Error;
    console.error("Login API Error:", err);
    return NextResponse.json({ message: err.message || 'An internal server error occurred' }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
