
'use server';

import { runQuery, runStatement, getSingleRow } from './db';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { emitSocketEvent } from './socket';

export type MarketplaceUser = {
    id: string;
    userType: 'Customer' | 'Dealer';
    fullName: string;
    phone: string;
    email?: string | null;
    password: string; // This will be the hashed password
    dealershipName?: string | null;
    dealershipType?: '4w' | '2w' | 'both' | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
    createdAt: string; // ISO string
    updatedAt: string; // ISO string
};

// Excludes password from objects returned to the client
export type SafeMarketplaceUser = Omit<MarketplaceUser, 'password'>;

// For creating a user, password is required
export type MarketplaceUserRegistrationData = Omit<MarketplaceUser, 'id' | 'createdAt' | 'updatedAt'>;


export async function findMarketplaceUserByPhone(phone: string): Promise<MarketplaceUser | null> {
    const user = await getSingleRow<MarketplaceUser>('SELECT * FROM MarketplaceUser WHERE phone = ?', [phone]);
    return user || null;
}

export async function getMarketplaceUsers(): Promise<{ customers: SafeMarketplaceUser[], dealers: SafeMarketplaceUser[] }> {
    const users = await runQuery<MarketplaceUser>('SELECT id, userType, fullName, phone, email, dealershipName, dealershipType, city, state, pincode, createdAt, updatedAt FROM MarketplaceUser ORDER BY createdAt DESC');
    
    const customers: SafeMarketplaceUser[] = [];
    const dealers: SafeMarketplaceUser[] = [];

    users.forEach(user => {
        if (user.userType === 'Customer') {
            customers.push(user);
        } else if (user.userType === 'Dealer') {
            dealers.push(user);
        }
    });

    return { customers, dealers };
}


export async function createMarketplaceUser(userData: MarketplaceUserRegistrationData): Promise<SafeMarketplaceUser> {
    const existingUser = await findMarketplaceUserByPhone(userData.phone);
    if (existingUser) {
        throw new Error('A user with this phone number already exists.');
    }

    const id = uuidv4();
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;
    
    // Hash the password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    const newUser: MarketplaceUser = {
        ...userData,
        id,
        password: hashedPassword,
        createdAt,
        updatedAt,
    };

    const sql = `
        INSERT INTO MarketplaceUser (
            id, userType, fullName, phone, email, password, dealershipName,
            dealershipType, city, state, pincode, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
        newUser.id, newUser.userType, newUser.fullName, newUser.phone, newUser.email,
        newUser.password, newUser.dealershipName, newUser.dealershipType, newUser.city,
        newUser.state, newUser.pincode, newUser.createdAt, newUser.updatedAt
    ];
    
    await runStatement(sql, params.map(p => p === undefined ? null : p));

    emitSocketEvent('new-notification', { type: 'marketplace-user', id: id, message: `New ${newUser.userType} registered: ${newUser.fullName}` });

    const { password, ...safeUser } = newUser;
    return safeUser;
}

export async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
}
