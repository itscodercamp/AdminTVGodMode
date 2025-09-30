
'use server';

import { runQuery, runStatement, getSingleRow } from './db';
import { v4 as uuidv4 } from 'uuid';
import { emitSocketEvent } from './socket';
import { z } from 'zod';

export type MarketplaceContact = {
    id: string;
    name: string;
    email: string;
    message: string;
    createdAt: string; // ISO String
    status: 'New' | 'Read' | 'Archived';
};

export type MarketplaceContactFormData = {
  name: string;
  email: string;
  message: string;
};


export async function getMarketplaceContactMessages(): Promise<MarketplaceContact[]> {
    return runQuery<MarketplaceContact>('SELECT * FROM MarketplaceContact ORDER BY createdAt DESC');
}

export async function addMarketplaceContact(contactData: MarketplaceContactFormData): Promise<MarketplaceContact> {
    const id = uuidv4();
    const createdAt = new Date().toISOString();
    const status: MarketplaceContact['status'] = 'New';
    
    const newContact: MarketplaceContact = {
        ...contactData,
        id,
        createdAt,
        status,
    };

    const sql = `
        INSERT INTO MarketplaceContact (id, name, email, message, createdAt, status)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    const params = [
        newContact.id, newContact.name, newContact.email, newContact.message, newContact.createdAt, newContact.status
    ];
    
    await runStatement(sql, params);

    emitSocketEvent('new-notification', { type: 'marketplace-contact', id: id, message: `Marketplace message from ${newContact.name}` });

    return newContact;
}

export async function updateMarketplaceContactStatus(id: string, status: MarketplaceContact['status']): Promise<MarketplaceContact | null> {
    const current = await getSingleRow<MarketplaceContact>('SELECT * FROM MarketplaceContact WHERE id = ?', [id]);
    if (!current) return null;

    await runStatement('UPDATE MarketplaceContact SET status = ? WHERE id = ?', [status, id]);
    return { ...current, status };
}


export async function deleteMarketplaceContact(id: string): Promise<boolean> {
    try {
        const result = await runStatement('DELETE FROM MarketplaceContact WHERE id = ?', [id]);
        return (result.changes ?? 0) > 0;
    } catch (error) {
        console.error("Failed to delete marketplace contact:", error);
        return false;
    }
}
