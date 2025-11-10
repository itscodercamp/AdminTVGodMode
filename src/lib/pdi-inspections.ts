
'use server';

import { runQuery, runStatement, getSingleRow } from './db';
import { v4 as uuidv4 } from 'uuid';
import { emitSocketEvent } from './socket';

export type PDIInspection = {
    id: string;
    name: string;
    phone: string;
    email: string;
    city: string;
    make: string;
    model: string;
    status: 'New' | 'Viewed' | 'Completed';
    createdAt: string; // ISO String
};

export type PDIInspectionFormData = Omit<PDIInspection, 'id' | 'createdAt' | 'status'>;

export async function getPDIInspections(): Promise<PDIInspection[]> {
    return runQuery<PDIInspection>('SELECT * FROM PDIInspection ORDER BY createdAt DESC');
}

export async function addPDIInspection(inspectionData: PDIInspectionFormData): Promise<PDIInspection> {
    const id = uuidv4();
    const createdAt = new Date().toISOString();
    const status: PDIInspection['status'] = 'New';
    
    const newInspection: PDIInspection = {
        ...inspectionData,
        id,
        createdAt,
        status,
    };

    const sql = `
        INSERT INTO PDIInspection (id, name, phone, email, city, make, model, status, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
        newInspection.id, newInspection.name, newInspection.phone, newInspection.email, 
        newInspection.city, newInspection.make, newInspection.model, newInspection.status, 
        newInspection.createdAt
    ];
    
    await runStatement(sql, params);

    emitSocketEvent('new-notification', { type: 'pdi-inspection', id: id, message: `New PDI request from ${newInspection.name}` });

    return newInspection;
}

export async function updatePDIInspectionStatus(id: string, status: PDIInspection['status']): Promise<PDIInspection | null> {
    const current = await getSingleRow<PDIInspection>('SELECT * FROM PDIInspection WHERE id = ?', [id]);
    if (!current) return null;

    await runStatement('UPDATE PDIInspection SET status = ? WHERE id = ?', [status, id]);
    return { ...current, status };
}


export async function deletePDIInspection(id: string): Promise<boolean> {
    try {
        const result = await runStatement('DELETE FROM PDIInspection WHERE id = ?', [id]);
        return (result.changes ?? 0) > 0;
    } catch (error) {
        console.error("Failed to delete PDI inspection request:", error);
        return false;
    }
}
