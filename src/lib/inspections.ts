
'use server';

import { getSingleRow, runQuery, runStatement } from './db';
import { emitSocketEvent } from './socket';
import type { Dealer } from './dealers';

export type Inspection = {
  id: string;
  fullName: string;
  phoneNumber: string;
  street: string | null;
  city: string | null;
  state: string | null;
  pinCode: string | null;
  vehicleMake: string;
  vehicleModel: string;
  registrationNumber: string;
  assignedToId: string;
  status: 'Requested' | 'Pending' | 'Completed' | 'Cancelled' | 'Viewed';
  source: 'Manual' | 'API';
  createdAt: string; // ISO String
  leadType: 'Dealer' | 'Customer';
  dealerId: string | null;
  carYear: string | null;
  inspectionType: string | null;
};


export async function getInspections(): Promise<Inspection[]> {
    const inspections = await runQuery<any>('SELECT * FROM Inspection ORDER BY createdAt DESC');
    // Migration for old data - map old fields to new fields if they exist
    return inspections.map(i => ({
        ...i,
        fullName: i.fullName || i.customerName,
        phoneNumber: i.phoneNumber || i.customerNumber,
        registrationNumber: i.registrationNumber || i.numberPlate,
        street: i.street,
        city: i.city,
        state: i.state,
        pinCode: i.pinCode,
    }));
}

export type AddInspectionData = Partial<{
    fullName: string;
    phoneNumber: string;
    street: string;
    city: string;
    state: string;
    pinCode: string;
    vehicleMake: string;
    vehicleModel: string;
    carYear: string;
    registrationNumber: string;
    inspectionType: string;
    assignedToId: string;
    source: 'Manual' | 'API';
    leadType: 'Dealer' | 'Customer';
    dealerId: string;
    status: 'Requested' | 'Pending' | 'Completed' | 'Cancelled' | 'Viewed';
}>;


export async function addInspection(inspectionData: AddInspectionData): Promise<Inspection> {
    const lastInspection = await runQuery<Inspection>('SELECT id FROM Inspection WHERE id LIKE "INS-%" ORDER BY CAST(SUBSTR(id, 5) AS INTEGER) DESC LIMIT 1');
    let newIdNumber = 1;
    if (lastInspection.length > 0) {
        const lastId = lastInspection[0].id;
        const lastNumber = parseInt(lastId.replace('INS-', ''), 10);
        newIdNumber = lastNumber + 1;
    }
    const id = `INS-${String(newIdNumber).padStart(7, '0')}`;

    const createdAt = new Date().toISOString();
    // If an assignedToId is provided and not 'Unassigned', status is Pending. Otherwise, it's 'Requested'.
    const status = (inspectionData.assignedToId && inspectionData.assignedToId !== 'Unassigned') ? 'Pending' : 'Requested';
    const source = inspectionData.source || 'Manual';
    const leadType = inspectionData.leadType || 'Customer';

    let dataToSave = { ...inspectionData };

    if (leadType === 'Dealer' && inspectionData.dealerId) {
        const dealer = await getSingleRow<Dealer>('SELECT * FROM Dealer WHERE id = ?', [inspectionData.dealerId]);
        if (dealer) {
            dataToSave.fullName = dealer.dealershipName;
            dataToSave.phoneNumber = dealer.phone;
        } else {
            throw new Error(`Dealer with ID ${inspectionData.dealerId} not found.`);
        }
    }
    
    const assignedToId = dataToSave.assignedToId || 'Unassigned';

    if (!dataToSave.fullName || !dataToSave.phoneNumber || !dataToSave.vehicleMake || !dataToSave.vehicleModel || !dataToSave.registrationNumber) {
        throw new Error("Missing one or more required fields for inspection.");
    }
    
    // Override status from request if it was specifically set (e.g. from API)
    const finalStatus = inspectionData.status || status;

    const sql = `
        INSERT INTO Inspection (id, fullName, phoneNumber, street, city, state, pinCode, vehicleMake, vehicleModel, carYear, registrationNumber, inspectionType, assignedToId, status, source, createdAt, leadType, dealerId)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await runStatement(sql, [
        id,
        dataToSave.fullName,
        dataToSave.phoneNumber,
        dataToSave.street || null,
        dataToSave.city || null,
        dataToSave.state || null,
        dataToSave.pinCode || null,
        dataToSave.vehicleMake,
        dataToSave.vehicleModel,
        dataToSave.carYear || null,
        dataToSave.registrationNumber,
        dataToSave.inspectionType || null,
        assignedToId,
        finalStatus,
        source,
        createdAt,
        leadType,
        inspectionData.dealerId || null
    ]);

    const newInspection: Inspection = { 
        id,
        fullName: dataToSave.fullName,
        phoneNumber: dataToSave.phoneNumber,
        street: dataToSave.street || null,
        city: dataToSave.city || null,
        state: dataToSave.state || null,
        pinCode: dataToSave.pinCode || null,
        vehicleMake: dataToSave.vehicleMake,
        vehicleModel: dataToSave.vehicleModel,
        registrationNumber: dataToSave.registrationNumber,
        carYear: dataToSave.carYear || null,
        inspectionType: dataToSave.inspectionType || null,
        assignedToId: assignedToId,
        status: finalStatus, 
        source: source,
        createdAt,
        leadType: leadType,
        dealerId: inspectionData.dealerId || null
    };
    
    emitSocketEvent('new-notification', { type: 'inspection', id: id, message: `New inspection for ${newInspection.fullName}` });
    const inspections = await getInspections();
    emitSocketEvent('update-counts', { inspections: inspections.length });

    return newInspection;
}

export async function updateInspectionStatus(id: string, status: Inspection['status']): Promise<Inspection | null> {
    const current = (await runQuery<Inspection>('SELECT * FROM Inspection WHERE id = ?', [id]))[0];
    if (!current) return null;

    const sql = `UPDATE Inspection SET status = ? WHERE id = ?`;
    await runStatement(sql, [status, id]);
    
    return { ...current, status };
}

export async function updateInspection(id: string, inspectionData: Partial<AddInspectionData>): Promise<Inspection | null> {
    const currentInspection = (await getSingleRow<Inspection>('SELECT * FROM Inspection WHERE id = ?', [id]));
    if (!currentInspection) return null;
    
    let fieldsToUpdate = { ...currentInspection, ...inspectionData };
    
    // If an inspector is being assigned to a 'Requested' inspection, update its status to 'Pending'
    if (currentInspection.status === 'Requested' && fieldsToUpdate.assignedToId && fieldsToUpdate.assignedToId !== 'Unassigned') {
        fieldsToUpdate.status = 'Pending';
    }


    const sql = `
        UPDATE Inspection
        SET fullName = ?, phoneNumber = ?, street = ?, city = ?, state = ?, pinCode = ?, 
            vehicleMake = ?, vehicleModel = ?, carYear = ?, registrationNumber = ?, inspectionType = ?, 
            assignedToId = ?, status = ?, leadType = ?, dealerId = ?
        WHERE id = ?
    `;
    await runStatement(sql, [
        fieldsToUpdate.fullName,
        fieldsToUpdate.phoneNumber,
        fieldsToUpdate.street,
        fieldsToUpdate.city,
        fieldsToUpdate.state,
        fieldsToUpdate.pinCode,
        fieldsToUpdate.vehicleMake,
        fieldsToUpdate.vehicleModel,
        fieldsToUpdate.carYear,
        fieldsToUpdate.registrationNumber,
        fieldsToUpdate.inspectionType,
        fieldsToUpdate.assignedToId,
        fieldsToUpdate.status,
        fieldsToUpdate.leadType,
        fieldsToUpdate.dealerId,
        id
    ]);

    return fieldsToUpdate as Inspection;
}

export async function deleteInspection(id: string): Promise<boolean> {
    try {
        const result = await runStatement('DELETE FROM Inspection WHERE id = ?', [id]);
        const wasDeleted = (result.changes ?? 0) > 0;
        if (wasDeleted) {
            const inspections = await getInspections();
            emitSocketEvent('update-counts', { inspections: inspections.length });
        }
        return wasDeleted;
    } catch (error) {
        return false;
    }
}
