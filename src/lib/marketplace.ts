

'use server';

import { runQuery, runStatement, getSingleRow } from './db';
import { v4 as uuidv4 } from 'uuid';
import { emitSocketEvent } from './socket';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export type MarketplaceVehicle = {
    id: string;
    category?: '4w' | '2w' | null;
    imageUrl?: string | null;
    year: number | null;
    make: string;
    model: string;
    variant?: string | null;
    price: number | null;
    status?: string | null;
    verified?: boolean | null;
    regYear?: number | null;
    mfgYear?: number | null;
    regNumber?: string | null;
    odometer?: number | null;
    fuelType?: string | null;
    transmission?: string | null;
    rtoState?: string | null;
    ownership?: string | null;
    insurance?: string | null;
    serviceHistory?: string | null;
    color?: string | null;
    img_front?: string | null;
    img_front_right?: string | null;
    img_right?: string | null;
    img_back_right?: string | null;
    img_back?: string | null;
    img_open_dickey?: string | null;
    img_back_left?: string | null;
    img_left?: string | null;
    img_front_left?: string | null;
    img_open_bonnet?: string | null;
    img_dashboard?: string | null;
    img_right_front_door?: string | null;
    img_right_back_door?: string | null;
    img_tyre_1?: string | null;
    img_tyre_2?: string | null;
    img_tyre_3?: string | null;
    img_tyre_4?: string | null;
    img_tyre_optional?: string | null;
    img_engine?: string | null;
    img_roof?: string | null;
    createdAt?: string | null; // ISO string
    updatedAt?: string | null; // ISO string
};


// The data type for adding/updating a vehicle.
export type VehicleFormData = Omit<MarketplaceVehicle, 'id' | 'createdAt' | 'updatedAt'>;

function parseVehicle(dbVehicle: any): MarketplaceVehicle {
    // No parsing needed for string fields
    return {
        ...dbVehicle,
        verified: dbVehicle.verified === 1,
    };
}


export async function getMarketplaceVehicles(): Promise<MarketplaceVehicle[]> {
    const vehicles = await runQuery<any>('SELECT * FROM MarketplaceVehicle ORDER BY createdAt DESC');
    return vehicles.map(parseVehicle);
}

export async function getMarketplaceVehicleById(id: string): Promise<MarketplaceVehicle | null> {
    const vehicle = await getSingleRow<any>('SELECT * FROM MarketplaceVehicle WHERE id = ?', [id]);
    if (!vehicle) return null;
    return parseVehicle(vehicle);
}

export async function addMarketplaceVehicle(vehicleData: VehicleFormData): Promise<MarketplaceVehicle> {
    const id = uuidv4();
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;
    
    const newVehicle: MarketplaceVehicle = {
        ...vehicleData,
        id,
        createdAt,
        updatedAt,
    };

    const sql = `
        INSERT INTO MarketplaceVehicle (
            id, category, imageUrl, year, make, model, variant, price, status, verified,
            regYear, mfgYear, regNumber, odometer, fuelType, transmission,
            rtoState, ownership, insurance, serviceHistory, color,
            img_front, img_front_right, img_right, img_back_right, img_back, img_open_dickey,
            img_back_left, img_left, img_front_left, img_open_bonnet, img_dashboard,
            img_right_front_door, img_right_back_door, img_tyre_1, img_tyre_2, img_tyre_3,
            img_tyre_4, img_tyre_optional, img_engine, img_roof,
            createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
        newVehicle.id, newVehicle.category, newVehicle.imageUrl, newVehicle.year, newVehicle.make, newVehicle.model,
        newVehicle.variant, newVehicle.price, newVehicle.status, newVehicle.verified,
        newVehicle.regYear, newVehicle.mfgYear, newVehicle.regNumber,
        newVehicle.odometer, newVehicle.fuelType, newVehicle.transmission, newVehicle.rtoState,
        newVehicle.ownership, newVehicle.insurance, newVehicle.serviceHistory, newVehicle.color,
        newVehicle.img_front, newVehicle.img_front_right, newVehicle.img_right, newVehicle.img_back_right,
        newVehicle.img_back, newVehicle.img_open_dickey, newVehicle.img_back_left, newVehicle.img_left,
        newVehicle.img_front_left, newVehicle.img_open_bonnet, newVehicle.img_dashboard,
        newVehicle.img_right_front_door, newVehicle.img_right_back_door, newVehicle.img_tyre_1,
        newVehicle.img_tyre_2, newVehicle.img_tyre_3, newVehicle.img_tyre_4, newVehicle.img_tyre_optional,
        newVehicle.img_engine, newVehicle.img_roof,
        newVehicle.createdAt, newVehicle.updatedAt
    ];
    
    await runStatement(sql, params.map(p => p === undefined ? null : p));

    emitSocketEvent('new-notification', { type: 'marketplace-vehicle', id: id, message: `New vehicle listed: ${newVehicle.make} ${newVehicle.model}` });

    return newVehicle;
}

export async function updateMarketplaceVehicle(id: string, vehicleData: Partial<VehicleFormData>): Promise<MarketplaceVehicle | null> {
    const currentVehicle = await getSingleRow<any>('SELECT * FROM MarketplaceVehicle WHERE id = ?', [id]);
    if (!currentVehicle) return null;

    const updatedAt = new Date().toISOString();
    const updatedData = { ...currentVehicle, ...vehicleData, updatedAt };
    
    const { id: currentId, ...dataToUpdate } = updatedData;

    const fields = Object.keys(dataToUpdate);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const sql = `UPDATE MarketplaceVehicle SET ${setClause} WHERE id = ?`;
    
    const params = Object.values(dataToUpdate);

    await runStatement(sql, [...params.map(p => p === undefined ? null : p), id]);

    return parseVehicle(updatedData);
}

async function generateDeletedVehicleReport(vehicle: MarketplaceVehicle): Promise<void> {
    const detailsHtml = Object.entries(vehicle)
        .filter(([key, value]) => value && !key.startsWith('img_') && key !== 'imageUrl')
        .map(([key, value]) => `<tr><td style="font-weight: bold; padding-right: 15px;">${key}</td><td>${value}</td></tr>`)
        .join('');

    const imagesHtml = Object.entries(vehicle)
        .filter(([key, value]) => (key.startsWith('img_') || key === 'imageUrl') && value)
        .map(([key, value]) => `
            <div style="margin: 10px; text-align: center;">
                <p>${key}</p>
                <img src="${value}" alt="${key}" style="max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 4px; padding: 5px;" />
            </div>
        `)
        .join('');

    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Deleted Vehicle Report: ${vehicle.make} ${vehicle.model}</title>
            <style>
                body { font-family: sans-serif; margin: 20px; }
                h1 { color: #333; }
                table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
                td { padding: 8px; border: 1px solid #ddd; }
                .image-container { display: flex; flex-wrap: wrap; }
            </style>
        </head>
        <body>
            <h1>Deleted Vehicle Report</h1>
            <h2>${vehicle.make} ${vehicle.model} (${vehicle.regNumber})</h2>
            <h3>Details</h3>
            <table>${detailsHtml}</table>
            <h3>Images</h3>
            <div class="image-container">${imagesHtml}</div>
        </body>
        </html>
    `;

    const dir = path.join(process.cwd(), 'public', 'deleted-vehicles');
    await mkdir(dir, { recursive: true });
    
    const filename = `deleted-${vehicle.make}-${vehicle.model}-${vehicle.id}.html`.replace(/\s+/g, '-');
    const filePath = path.join(dir, filename);

    await writeFile(filePath, htmlContent);
    console.log(`Deleted vehicle report saved to: ${filePath}`);
}


export async function deleteMarketplaceVehicle(id: string): Promise<boolean> {
    try {
        const vehicle = await getSingleRow<MarketplaceVehicle>('SELECT * FROM MarketplaceVehicle WHERE id = ?', [id]);
        if (vehicle) {
            await generateDeletedVehicleReport(vehicle);
        }

        const result = await runStatement('DELETE FROM MarketplaceVehicle WHERE id = ?', [id]);
        return (result.changes ?? 0) > 0;
    } catch (error) {
        console.error("Failed to delete marketplace vehicle:", error);
        return false;
    }
}
