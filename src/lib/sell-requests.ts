
'use server';

import { runQuery, runStatement } from './db';
import { randomUUID } from 'crypto';
import { emitSocketEvent } from './socket';

export type SellCarRequest = {
    id: string;
    make: string;
    model: string;
    year: string;
    variant: string;
    fuelType: string;
    transmission: string;
    kmDriven: string;
    owners: string;
    registrationState: string;
    city: string;
    sellerName: string;
    phone: string;
    email: string;
    description: string;
    status: 'New' | 'Contacted' | 'Closed';
    createdAt: string; // ISO String
};

export async function getSellCarRequests(): Promise<SellCarRequest[]> {
    return runQuery<SellCarRequest>('SELECT * FROM SellCarRequest ORDER BY createdAt DESC');
}

export async function addSellCarRequest(requestData: Omit<SellCarRequest, 'id' | 'createdAt' | 'status'>): Promise<SellCarRequest> {
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    const status = 'New';
    
    const sql = `
        INSERT INTO SellCarRequest (id, make, model, year, variant, fuelType, transmission, kmDriven, owners, registrationState, city, sellerName, phone, email, description, status, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await runStatement(sql, [
        id,
        requestData.make,
        requestData.model,
        requestData.year,
        requestData.variant,
        requestData.fuelType,
        requestData.transmission,
        requestData.kmDriven,
        requestData.owners,
        requestData.registrationState,
        requestData.city,
        requestData.sellerName,
        requestData.phone,
        requestData.email,
        requestData.description,
        status,
        createdAt
    ]);
    
    const newRequest = { ...requestData, id, createdAt, status };

    emitSocketEvent('new-notification', { type: 'sell-request', id: id, message: `New sell request from ${newRequest.sellerName}` });

    return newRequest;
}

export async function updateSellCarRequestStatus(id: string, status: SellCarRequest['status']): Promise<SellCarRequest | null> {
    const current = (await runQuery<SellCarRequest>('SELECT * FROM SellCarRequest WHERE id = ?', [id]))[0];
    if (!current) return null;

    const sql = `UPDATE SellCarRequest SET status = ? WHERE id = ?`;
    await runStatement(sql, [status, id]);

    return { ...current, status };
}

export async function deleteSellCarRequest(id: string): Promise<boolean> {
    try {
        const result = await runStatement('DELETE FROM SellCarRequest WHERE id = ?', [id]);
        return (result.changes ?? 0) > 0;
    } catch (error) {
        console.error("Failed to delete sell car request:", error);
        return false;
    }
}
