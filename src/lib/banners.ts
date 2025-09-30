
'use server';

import { runQuery, runStatement, getSingleRow } from './db';
import { v4 as uuidv4 } from 'uuid';
import { emitSocketEvent } from './socket';

export type MarketplaceBanner = {
    id: string;
    title: string;
    imageUrl: string;
    status: 'Active' | 'Inactive';
    createdAt: string; // ISO string
    updatedAt: string; // ISO string
};

export type BannerFormData = Omit<MarketplaceBanner, 'id' | 'createdAt' | 'updatedAt'>;

export async function getBanners(): Promise<MarketplaceBanner[]> {
    return runQuery<MarketplaceBanner>('SELECT * FROM MarketplaceBanner ORDER BY createdAt DESC');
}

export async function getActiveBanners(): Promise<MarketplaceBanner[]> {
    return runQuery<MarketplaceBanner>("SELECT * FROM MarketplaceBanner WHERE status = 'Active' ORDER BY createdAt DESC");
}

export async function addBanner(bannerData: BannerFormData): Promise<MarketplaceBanner> {
    const id = uuidv4();
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;
    
    const newBanner: MarketplaceBanner = {
        ...bannerData,
        id,
        createdAt,
        updatedAt,
    };

    const sql = `
        INSERT INTO MarketplaceBanner (id, title, imageUrl, status, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    const params = [
        newBanner.id, newBanner.title, newBanner.imageUrl, newBanner.status, newBanner.createdAt, newBanner.updatedAt
    ];
    
    await runStatement(sql, params);

    emitSocketEvent('new-notification', { type: 'marketplace-banner', id: id, message: `New banner added: ${newBanner.title}` });

    return newBanner;
}

export async function updateBanner(id: string, bannerData: Partial<BannerFormData>): Promise<MarketplaceBanner | null> {
    const currentBanner = await getSingleRow<MarketplaceBanner>('SELECT * FROM MarketplaceBanner WHERE id = ?', [id]);
    if (!currentBanner) return null;

    const updatedAt = new Date().toISOString();
    const updatedData = { ...currentBanner, ...bannerData, updatedAt };
    
    const sql = `UPDATE MarketplaceBanner SET title = ?, imageUrl = ?, status = ?, updatedAt = ? WHERE id = ?`;
    
    const params = [
        updatedData.title, updatedData.imageUrl, updatedData.status, updatedData.updatedAt, id
    ];

    await runStatement(sql, params);

    return updatedData;
}


export async function deleteBanner(id: string): Promise<boolean> {
    try {
        const result = await runStatement('DELETE FROM MarketplaceBanner WHERE id = ?', [id]);
        return (result.changes ?? 0) > 0;
    } catch (error) {
        console.error("Failed to delete banner:", error);
        return false;
    }
}
