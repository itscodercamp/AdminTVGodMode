
'use server';

import { NextResponse } from 'next/server';
import { getActiveBanners, addBanner, BannerFormData } from '@/lib/banners';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function GET(request: Request) {
  try {
    const activeBanners = await getActiveBanners();
    // Simplified response to only include title and imageUrl
    const simplifiedBanners = activeBanners.map(banner => ({
        title: banner.title,
        imageUrl: banner.imageUrl
    }));
    return NextResponse.json(simplifiedBanners, { status: 200, headers: CORS_HEADERS });
  } catch (error) {
    const err = error as Error;
    console.error("Marketplace GET Banners API Error:", err);
    return NextResponse.json({ message: err.message || 'An internal server error occurred' }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!body.title || !body.imageUrl) {
      return NextResponse.json({ message: 'Missing required fields: title, imageUrl' }, { status: 400, headers: CORS_HEADERS });
    }

    const bannerData: BannerFormData = {
        title: body.title,
        imageUrl: body.imageUrl,
        status: body.status || 'Active'
    };

    const newBanner = await addBanner(bannerData);

    return NextResponse.json({ message: 'Banner added successfully via API', banner: newBanner }, { status: 201, headers: CORS_HEADERS });
  } catch (error) {
    const err = error as Error;
    console.error("Marketplace Banner API Error:", err);
    if (err instanceof SyntaxError) {
        return NextResponse.json({ message: 'Invalid JSON payload provided.' }, { status: 400, headers: CORS_HEADERS });
    }
    return NextResponse.json({ message: err.message || 'An internal server error occurred' }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
