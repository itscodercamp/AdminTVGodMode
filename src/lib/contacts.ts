
'use server';

import { runQuery, runStatement } from './db';
import { randomUUID } from 'crypto';
import { emitSocketEvent } from './socket';


export type ContactSubmission = {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    subject: string;
    message: string;
    date: string; // ISO String
    status: 'New' | 'Read' | 'Archived';
};


export async function getContactSubmissions(): Promise<ContactSubmission[]> {
    return runQuery<ContactSubmission>('SELECT * FROM ContactSubmission ORDER BY date DESC');
}

export async function addContactSubmission(submissionData: Omit<ContactSubmission, 'id' | 'date' | 'status'>): Promise<ContactSubmission> {
    const id = randomUUID();
    const date = new Date().toISOString();
    const status = 'New';
    
    const sql = `
        INSERT INTO ContactSubmission (id, name, email, phone, subject, message, date, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await runStatement(sql, [
        id,
        submissionData.name,
        submissionData.email,
        submissionData.phone,
        submissionData.subject,
        submissionData.message,
        date,
        status
    ]);
    
    const newSubmission = { ...submissionData, id, date, status };

    // Notify clients
    emitSocketEvent('new-notification', { type: 'contact', id: id, message: `New contact from ${newSubmission.name}` });

    return newSubmission;
}

export async function updateContactStatus(id: string, status: ContactSubmission['status']): Promise<ContactSubmission | null> {
    const current = (await runQuery<ContactSubmission>('SELECT * FROM ContactSubmission WHERE id = ?', [id]))[0];
    if (!current) return null;

    const sql = `UPDATE ContactSubmission SET status = ? WHERE id = ?`;
    await runStatement(sql, [status, id]);

    return { ...current, status };
}


export async function deleteContactSubmission(id: string): Promise<boolean> {
    try {
        const result = await runStatement('DELETE FROM ContactSubmission WHERE id = ?', [id]);
        return (result.changes ?? 0) > 0;
    } catch (error) {
        console.error("Failed to delete contact submission:", error);
        return false;
    }
}
