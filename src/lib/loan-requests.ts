
'use server';

import { runQuery, runStatement, getSingleRow } from './db';
import { v4 as uuidv4 } from 'uuid';
import { emitSocketEvent } from './socket';

export type LoanRequest = {
    id: string;
    name: string;
    phone: string;
    email: string;
    make: string;
    model: string;
    variant: string | null;
    panNumber: string;
    aadharNumber: string;
    status: 'New' | 'Contacted' | 'Closed';
    createdAt: string; // ISO String
};

export type LoanRequestFormData = Omit<LoanRequest, 'id' | 'createdAt' | 'status'>;

export async function getLoanRequests(): Promise<LoanRequest[]> {
    return runQuery<LoanRequest>('SELECT * FROM LoanRequest ORDER BY createdAt DESC');
}

export async function addLoanRequest(requestData: LoanRequestFormData): Promise<LoanRequest> {
    const id = uuidv4();
    const createdAt = new Date().toISOString();
    const status: LoanRequest['status'] = 'New';
    
    const newRequest: LoanRequest = {
        ...requestData,
        variant: requestData.variant || null,
        id,
        createdAt,
        status,
    };

    const sql = `
        INSERT INTO LoanRequest (id, name, phone, email, make, model, variant, panNumber, aadharNumber, status, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
        newRequest.id, newRequest.name, newRequest.phone, newRequest.email, newRequest.make,
        newRequest.model, newRequest.variant, newRequest.panNumber, newRequest.aadharNumber,
        newRequest.status, newRequest.createdAt
    ];
    
    await runStatement(sql, params);

    emitSocketEvent('new-notification', { type: 'loan-request', id: id, message: `New loan request from ${newRequest.name}` });

    return newRequest;
}

export async function updateLoanRequestStatus(id: string, status: LoanRequest['status']): Promise<LoanRequest | null> {
    const current = await getSingleRow<LoanRequest>('SELECT * FROM LoanRequest WHERE id = ?', [id]);
    if (!current) return null;

    await runStatement('UPDATE LoanRequest SET status = ? WHERE id = ?', [status, id]);
    return { ...current, status };
}


export async function deleteLoanRequest(id: string): Promise<boolean> {
    try {
        const result = await runStatement('DELETE FROM LoanRequest WHERE id = ?', [id]);
        return (result.changes ?? 0) > 0;
    } catch (error) {
        console.error("Failed to delete loan request:", error);
        return false;
    }
}
