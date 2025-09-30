
'use server';

import { NextResponse } from 'next/server';
import { addInspection, type AddInspectionData } from '@/lib/inspections';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // For API-submitted inspections, status should be 'Requested' and assignedToId 'Unassigned'
    // so the admin can assign it from the dashboard.
    const inspectionData: AddInspectionData = {
        fullName: body.fullName,
        phoneNumber: body.phoneNumber,
        street: body.street,
        city: body.city,
        state: body.state,
        pinCode: body.pinCode,
        vehicleMake: body.carMake,
        vehicleModel: body.carModel,
        carYear: body.carYear,
        registrationNumber: body.registrationNumber || body.plateNumber, // Accept both
        inspectionType: body.inspectionType,
        leadType: body.leadType || 'Customer', // Default to customer
        dealerId: body.dealerId,
        source: 'API',
        assignedToId: 'Unassigned',
        status: 'Requested',
    };

    // --- Validation ---
    const requiredCustomerFields: (keyof AddInspectionData)[] = ['fullName', 'phoneNumber', 'vehicleMake', 'vehicleModel', 'registrationNumber'];
    const requiredDealerFields: (keyof AddInspectionData)[] = ['dealerId', 'vehicleMake', 'vehicleModel', 'registrationNumber'];

    const requiredFields = inspectionData.leadType === 'Dealer' ? requiredDealerFields : requiredCustomerFields;
    
    for (const field of requiredFields) {
        if (!inspectionData[field]) {
            return NextResponse.json({ message: `Missing required field for API: ${field}` }, { status: 400, headers: CORS_HEADERS });
        }
    }

    const newInspection = await addInspection(inspectionData);

    return NextResponse.json({ message: 'Inspection created successfully via API', inspection: newInspection }, { status: 201, headers: CORS_HEADERS });
  } catch (error) {
    const err = error as Error;
    console.error("Inspection API Error:", err);
    return NextResponse.json({ message: err.message || 'An internal server error occurred' }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
