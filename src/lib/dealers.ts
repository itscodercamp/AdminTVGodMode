
'use server';

import { runQuery, runStatement } from './db';
import { randomUUID } from 'crypto';
import { emitSocketEvent } from './socket';

export type Dealer = {
    id: string;
    dealershipName: string;
    ownerName: string;
    email: string;
    phone: string;
    address: string;
    joiningDate: string; // ISO String
    status: 'Active' | 'Inactive' | 'Deleted';
    deletionReason?: string | null;
    deletedAt?: string | null; // ISO string
};

export type DealerWithLeads = Dealer & { leadsCount: number };

export async function getDealers(): Promise<DealerWithLeads[]> {
    const dealers = await runQuery<Dealer>("SELECT * FROM Dealer WHERE status != 'Deleted' ORDER BY joiningDate DESC");
    const inspections = await runQuery<{ dealerId: string, count: number }>("SELECT dealerId, COUNT(*) as count FROM Inspection WHERE dealerId IS NOT NULL GROUP BY dealerId");
    
    const leadsMap = new Map<string, number>();
    inspections.forEach(item => {
        leadsMap.set(item.dealerId, item.count);
    });

    return dealers.map(dealer => ({
        ...dealer,
        leadsCount: leadsMap.get(dealer.id) || 0
    }));
}

export async function getDeletedDealers(): Promise<Dealer[]> {
    return runQuery<Dealer>("SELECT * FROM Dealer WHERE status = 'Deleted' ORDER BY deletedAt DESC");
}


export async function addDealer(dealerData: Omit<Dealer, 'id' | 'status'>): Promise<Dealer> {
    const id = randomUUID();
    const status = 'Active';

    const sql = `
        INSERT INTO Dealer (id, dealershipName, ownerName, email, phone, address, joiningDate, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await runStatement(sql, [
        id,
        dealerData.dealershipName,
        dealerData.ownerName,
        dealerData.email,
        dealerData.phone,
        dealerData.address,
        dealerData.joiningDate,
        status,
    ]);
    
    const dealers = await getDealers();
    emitSocketEvent('update-counts', { dealers: dealers.length });

    return { ...dealerData, id, status };
}

export async function updateDealer(id: string, dealerData: Partial<Omit<Dealer, 'id'>>): Promise<Dealer | null> {
    const currentDealer = (await runQuery<Dealer>('SELECT * FROM Dealer WHERE id = ?', [id]))[0];
    if (!currentDealer) return null;

    const fieldsToUpdate = { ...currentDealer, ...dealerData };

    const sql = `
        UPDATE Dealer
        SET dealershipName = ?, ownerName = ?, email = ?, phone = ?, address = ?, joiningDate = ?, status = ?
        WHERE id = ?
    `;
    
    await runStatement(sql, [
        fieldsToUpdate.dealershipName,
        fieldsToUpdate.ownerName,
        fieldsToUpdate.email,
        fieldsToUpdate.phone,
        fieldsToUpdate.address,
        fieldsToUpdate.joiningDate,
        fieldsToUpdate.status,
        id
    ]);

    const dealers = await getDealers();
    emitSocketEvent('update-counts', { dealers: dealers.length });

    return fieldsToUpdate;
}

export async function deleteDealer(id: string, reason: string): Promise<boolean> {
    try {
        const deletedAt = new Date().toISOString();
        const result = await runStatement("UPDATE Dealer SET status = 'Deleted', deletionReason = ?, deletedAt = ? WHERE id = ?", [reason, deletedAt, id]);
        const wasDeleted = (result.changes ?? 0) > 0;
        if(wasDeleted) {
            const dealers = await getDealers();
            emitSocketEvent('update-counts', { dealers: dealers.length });
        }
        return wasDeleted;
    } catch (error) {
        return false;
    }
}

export async function restoreDealer(id: string): Promise<boolean> {
    try {
        const result = await runStatement("UPDATE Dealer SET status = 'Active', deletionReason = NULL, deletedAt = NULL WHERE id = ?", [id]);
        return (result.changes ?? 0) > 0;
    } catch (error) {
        console.error("Failed to restore dealer:", error);
        return false;
    }
}

export async function permanentlyDeleteDealer(id: string): Promise<boolean> {
    try {
        const result = await runStatement('DELETE FROM Dealer WHERE id = ?', [id]);
        return (result.changes ?? 0) > 0;
    } catch (error) {
        console.error("Failed to permanently delete dealer:", error);
        return false;
    }
}
