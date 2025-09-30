
'use server';

import { runQuery, runStatement } from './db';
import { randomUUID } from 'crypto';
import { emitSocketEvent } from './socket';

export type WebsiteInspection = {
    id: string;
    fullName: string;
    phoneNumber: string;
    carMake: string;
    carModel: string;
    carYear: string | null;
    inspectionType: string | null;
    registrationNumber: string | null;
    street: string | null;
    city: string | null;
    state: string | null;
    pinCode: string | null;
    status: 'New' | 'Viewed' | 'Contacted';
    createdAt: string; // ISO String
};


export async function getWebsiteInspections(): Promise<WebsiteInspection[]> {
    return runQuery<WebsiteInspection>('SELECT * FROM WebsiteInspectionRequest ORDER BY createdAt DESC');
}

export async function addWebsiteInspection(requestData: Omit<WebsiteInspection, 'id' | 'createdAt' | 'status'>): Promise<WebsiteInspection> {
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    const status = 'New';
    
    const sql = `
        INSERT INTO WebsiteInspectionRequest (
            id, fullName, phoneNumber, carMake, carModel, carYear, inspectionType, 
            registrationNumber, street, city, state, pinCode, status, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await runStatement(sql, [
        id,
        requestData.fullName,
        requestData.phoneNumber,
        requestData.carMake,
        requestData.carModel,
        requestData.carYear,
        requestData.inspectionType,
        requestData.registrationNumber,
        requestData.street,
        requestData.city,
        requestData.state,
        requestData.pinCode,
        status,
        createdAt
    ]);
    
    const newRequest = { ...requestData, id, createdAt, status };

    emitSocketEvent('new-notification', { type: 'website-inspection', id: id, message: `Website inspection req from ${newRequest.fullName}` });

    return newRequest;
}

export async function updateWebsiteInspectionStatus(id: string, status: WebsiteInspection['status']): Promise<WebsiteInspection | null> {
    const current = (await runQuery<WebsiteInspection>('SELECT * FROM WebsiteInspectionRequest WHERE id = ?', [id]))[0];
    if (!current) return null;

    const sql = `UPDATE WebsiteInspectionRequest SET status = ? WHERE id = ?`;
    await runStatement(sql, [status, id]);

    return { ...current, status };
}

export async function deleteWebsiteInspection(id: string): Promise<boolean> {
    try {
        const result = await runStatement('DELETE FROM WebsiteInspectionRequest WHERE id = ?', [id]);
        return (result.changes ?? 0) > 0;
    } catch (error) {
        console.error("Failed to delete website inspection request:", error);
        return false;
    }
}
