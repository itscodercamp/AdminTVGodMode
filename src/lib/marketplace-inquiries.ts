
'use server';

import { runQuery, runStatement, getSingleRow } from './db';
import { v4 as uuidv4 } from 'uuid';
import { emitSocketEvent } from './socket';
import type { MarketplaceVehicle } from './marketplace';
import type { SafeMarketplaceUser } from './marketplace-users';

export type InquiryFormData = {
  vehicleId: string;
  userId: string;
};

export type MarketplaceInquiry = {
    id: string;
    vehicleId: string;
    userId: string;
    createdAt: string; // ISO String
    status: 'New' | 'Contacted' | 'Closed';
};

export type FullInquiry = {
    id: string;
    createdAt: string;
    status: 'New' | 'Contacted' | 'Closed';
    vehicle: Pick<MarketplaceVehicle, 'id' | 'make' | 'model' | 'price' | 'imageUrl'>;
    user: Pick<SafeMarketplaceUser, 'id' | 'fullName' | 'phone' | 'email'>;
}

export async function getMarketplaceInquiries(): Promise<FullInquiry[]> {
    const sql = `
        SELECT 
            i.id, i.createdAt, i.status,
            v.id as vehicleId, v.make, v.model, v.price, v.imageUrl,
            u.id as userId, u.fullName, u.phone, u.email
        FROM MarketplaceInquiry i
        JOIN MarketplaceVehicle v ON i.vehicleId = v.id
        JOIN MarketplaceUser u ON i.userId = u.id
        ORDER BY i.createdAt DESC
    `;
    const results = await runQuery<any>(sql);

    return results.map(row => ({
        id: row.id,
        createdAt: row.createdAt,
        status: row.status,
        vehicle: {
            id: row.vehicleId,
            make: row.make,
            model: row.model,
            price: row.price,
            imageUrl: row.imageUrl,
        },
        user: {
            id: row.userId,
            fullName: row.fullName,
            phone: row.phone,
            email: row.email,
        }
    }));
}

export async function addMarketplaceInquiry(inquiryData: InquiryFormData): Promise<MarketplaceInquiry> {
    // Check if vehicle and user exist
    const vehicle = await getSingleRow('SELECT id FROM MarketplaceVehicle WHERE id = ?', [inquiryData.vehicleId]);
    if (!vehicle) throw new Error('Vehicle not found.');
    
    const user = await getSingleRow('SELECT id FROM MarketplaceUser WHERE id = ?', [inquiryData.userId]);
    if (!user) throw new Error('User not found.');

    const id = uuidv4();
    const createdAt = new Date().toISOString();
    const status: MarketplaceInquiry['status'] = 'New';
    
    const newInquiry: MarketplaceInquiry = {
        ...inquiryData,
        id,
        createdAt,
        status,
    };

    const sql = `
        INSERT INTO MarketplaceInquiry (id, vehicleId, userId, createdAt, status)
        VALUES (?, ?, ?, ?, ?)
    `;

    const params = [
        newInquiry.id, newInquiry.vehicleId, newInquiry.userId, newInquiry.createdAt, newInquiry.status
    ];
    
    await runStatement(sql, params);

    emitSocketEvent('new-notification', { type: 'marketplace-inquiry', id: id, message: `New vehicle inquiry from User ID ${newInquiry.userId.substring(0,8)}...` });

    return newInquiry;
}

export async function updateMarketplaceInquiryStatus(id: string, status: MarketplaceInquiry['status']): Promise<MarketplaceInquiry | null> {
    const current = await getSingleRow<MarketplaceInquiry>('SELECT * FROM MarketplaceInquiry WHERE id = ?', [id]);
    if (!current) return null;

    await runStatement('UPDATE MarketplaceInquiry SET status = ? WHERE id = ?', [status, id]);
    return { ...current, status };
}


export async function deleteMarketplaceInquiry(id: string): Promise<boolean> {
    try {
        const result = await runStatement('DELETE FROM MarketplaceInquiry WHERE id = ?', [id]);
        return (result.changes ?? 0) > 0;
    } catch (error) {
        console.error("Failed to delete marketplace inquiry:", error);
        return false;
    }
}
