
'use server';

import { NextResponse } from 'next/server';
import { getMarketplaceVehicleById } from '@/lib/marketplace';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const vehicleId = params.id;
    if (!vehicleId) {
      return NextResponse.json({ message: 'Vehicle ID is required' }, { status: 400, headers: CORS_HEADERS });
    }

    const vehicle = await getMarketplaceVehicleById(vehicleId);

    if (!vehicle) {
      return NextResponse.json({ message: `Vehicle with ID ${vehicleId} not found` }, { status: 404, headers: CORS_HEADERS });
    }

    return NextResponse.json(vehicle, { status: 200, headers: CORS_HEADERS });
  } catch (error) {
    const err = error as Error;
    console.error(`Marketplace GET Vehicle (ID: ${params.id}) API Error:`, err);
    return NextResponse.json({ message: err.message || 'An internal server error occurred' }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
