
'use server';

import { runQuery, runStatement, getSingleRow } from './db';
import { v4 as uuidv4 } from 'uuid';
import { emitSocketEvent } from './socket';

export type InsuranceRenewal = {
    id: string;
    name: string;
    phone: string;
    registrationNumber: string;
    insuranceType: string;
    status: 'New' | 'Contacted' | 'Closed';
    createdAt: string; // ISO String
};

export type InsuranceRenewalFormData = Omit<InsuranceRenewal, 'id' | 'createdAt' | 'status'>;

export async function getInsuranceRenewals(): Promise<InsuranceRenewal[]> {
    return runQuery<InsuranceRenewal>('SELECT * FROM InsuranceRenewal ORDER BY createdAt DESC');
}

export async function addInsuranceRenewal(renewalData: InsuranceRenewalFormData): Promise<InsuranceRenewal> {
    const id = uuidv4();
    const createdAt = new Date().toISOString();
    const status: InsuranceRenewal['status'] = 'New';
    
    const newRenewal: InsuranceRenewal = {
        ...renewalData,
        id,
        createdAt,
        status,
    };

    const sql = `
        INSERT INTO InsuranceRenewal (id, name, phone, registrationNumber, insuranceType, status, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
        newRenewal.id, newRenewal.name, newRenewal.phone, newRenewal.registrationNumber, 
        newRenewal.insuranceType, newRenewal.status, newRenewal.createdAt
    ];
    
    await runStatement(sql, params);

    emitSocketEvent('new-notification', { type: 'insurance-renewal', id: id, message: `New insurance renewal for ${newRenewal.name}` });

    return newRenewal;
}

export async function updateInsuranceRenewalStatus(id: string, status: InsuranceRenewal['status']): Promise<InsuranceRenewal | null> {
    const current = await getSingleRow<InsuranceRenewal>('SELECT * FROM InsuranceRenewal WHERE id = ?', [id]);
    if (!current) return null;

    await runStatement('UPDATE InsuranceRenewal SET status = ? WHERE id = ?', [status, id]);
    return { ...current, status };
}


export async function deleteInsuranceRenewal(id: string): Promise<boolean> {
    try {
        const result = await runStatement('DELETE FROM InsuranceRenewal WHERE id = ?', [id]);
        return (result.changes ?? 0) > 0;
    } catch (error) {
        console.error("Failed to delete insurance renewal request:", error);
        return false;
    }
}
