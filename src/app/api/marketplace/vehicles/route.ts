
'use server';

import { NextResponse } from 'next/server';
import { addMarketplaceVehicle, getMarketplaceVehicles, type VehicleFormData } from '@/lib/marketplace';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function GET(request: Request) {
  try {
    const allVehicles = await getMarketplaceVehicles();
    const liveVehicles = allVehicles.filter(v => v.status === 'For Sale');

    // User ne jo fields maange hain, sirf wahi return karein
    const simplifiedVehicles = liveVehicles.map(v => ({
        id: v.id,
        make: v.make,
        model: v.model,
        variant: v.variant,
        price: v.price,
        fuelType: v.fuelType,
        odometer: v.odometer,
        rtoState: v.rtoState,
        imageUrl: v.imageUrl, // imageUrl zaroori hai
    }));

    return NextResponse.json(simplifiedVehicles, { status: 200, headers: CORS_HEADERS });
  } catch (error) {
    const err = error as Error;
    console.error("Marketplace GET Vehicles API Error:", err);
    return NextResponse.json({ message: err.message || 'An internal server error occurred' }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Basic validation
    if (!body.make || !body.model || !body.price) {
      return NextResponse.json({ message: 'Missing required fields: make, model, price' }, { status: 400, headers: CORS_HEADERS });
    }

    // The body should conform to the VehicleFormData type.
    // The addMarketplaceVehicle function will handle adding the ID and timestamps.
    const vehicleData: VehicleFormData = body;

    const newVehicle = await addMarketplaceVehicle(vehicleData);

    return NextResponse.json({ message: 'Vehicle listed successfully via API', vehicle: newVehicle }, { status: 201, headers: CORS_HEADERS });
  } catch (error)
   {
    const err = error as Error;
    console.error("Marketplace Vehicle API Error:", err);
    // Check for JSON parsing errors specifically
    if (err instanceof SyntaxError) {
        return NextResponse.json({ message: 'Invalid JSON payload provided.' }, { status: 400, headers: CORS_HEADERS });
    }
    return NextResponse.json({ message: err.message || 'An internal server error occurred' }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
