
'use server';

import { runQuery, runStatement } from './db';
import { emitSocketEvent } from './socket';
import bcrypt from 'bcryptjs';

// Re-defining the User type as Prisma is removed
export type User = {
    id: string;
    email: string;
    name: string;
    password?: string;
    phone: string | null;
    dob: string; // Stored as ISO string
    joiningDate: string; // Stored as ISO string
    designation: 'Sales' | 'Inspector' | 'Manager' | 'Admin';
    status: 'Active' | 'Inactive' | 'Deleted';
    deletionReason?: string | null;
    deletedAt?: string | null; // ISO string
};

export async function getUsers(): Promise<Omit<User, 'password'>[]> {
    const users = await runQuery<User>("SELECT id, email, name, phone, dob, joiningDate, designation, status, deletionReason, deletedAt FROM User WHERE status != 'Deleted'");
    return users;
}

export async function getDeletedUsers(): Promise<Omit<User, 'password'>[]> {
    const users = await runQuery<User>("SELECT id, email, name, phone, dob, joiningDate, designation, status, deletionReason, deletedAt FROM User WHERE status = 'Deleted'");
    return users;
}

export async function findUserByEmail(email: string): Promise<User | null> {
    const users = await runQuery<User>('SELECT * FROM User WHERE email = ?', [email]);
    return users[0] || null;
}

export async function addUser(userData: Omit<User, 'id' | 'status'>): Promise<Omit<User, 'password'>> {
    if (!userData.password) {
        throw new Error("Password is required for a new user.");
    }

    // Generate sequential employee ID like TVE-000001
    const lastUser = await runQuery<User>('SELECT id FROM User WHERE id LIKE "TVE-%" ORDER BY CAST(SUBSTR(id, 5) AS INTEGER) DESC LIMIT 1');
    let newIdNumber = 1;
    if (lastUser.length > 0) {
        const lastId = lastUser[0].id;
        const lastNumber = parseInt(lastId.replace('TVE-', ''), 10);
        newIdNumber = lastNumber + 1;
    }
    const employeeId = `TVE-${String(newIdNumber).padStart(6, '0')}`;
    
    // Hash the password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);


    const sql = `
        INSERT INTO User (id, email, name, password, phone, dob, joiningDate, designation, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await runStatement(sql, [
        employeeId,
        userData.email,
        userData.name,
        hashedPassword,
        userData.phone,
        userData.dob,
        userData.joiningDate || new Date().toISOString(),
        userData.designation,
        'Active' // Default status
    ]);

    const { password, ...newUser } = { ...userData, id: employeeId, status: 'Active' as const };
    
    const users = await getUsers();
    emitSocketEvent('update-counts', { users: users.length });

    return newUser;
}

export async function updateUser(id: string, userData: Partial<User>): Promise<Omit<User, 'password'> | null> {
    const user = (await runQuery<User>('SELECT * FROM User WHERE id = ?', [id]))[0];
    if (!user) return null;

    const fieldsToUpdate = { ...user, ...userData };
    
    // If password is in userData and it's not empty, hash it for update. Otherwise, keep the old one.
    let passwordToUpdate = user.password;
    if (userData.password && userData.password.length > 0) {
        const salt = await bcrypt.genSalt(10);
        passwordToUpdate = await bcrypt.hash(userData.password, salt);
    }
    
    const sql = `
        UPDATE User
        SET name = ?, email = ?, phone = ?, dob = ?, joiningDate = ?, designation = ?, status = ?, password = ?
        WHERE id = ?
    `;

    await runStatement(sql, [
        fieldsToUpdate.name,
        fieldsToUpdate.email,
        fieldsToUpdate.phone,
        fieldsToUpdate.dob,
        fieldsToUpdate.joiningDate,
        fieldsToUpdate.designation,
        fieldsToUpdate.status,
        passwordToUpdate,
        id
    ]);

    const { password, ...updatedUser } = { ...fieldsToUpdate, id, password: passwordToUpdate };

    const users = await getUsers();
    emitSocketEvent('update-counts', { users: users.length });

    return updatedUser;
}

export async function deleteUser(id: string, reason: string): Promise<boolean> {
    try {
        const deletedAt = new Date().toISOString();
        const result = await runStatement("UPDATE User SET status = 'Deleted', deletionReason = ?, deletedAt = ? WHERE id = ?", [reason, deletedAt, id]);
        const wasDeleted = (result.changes ?? 0) > 0;
        if (wasDeleted) {
            const users = await getUsers();
            emitSocketEvent('update-counts', { users: users.length });
        }
        return wasDeleted;
    } catch (error) {
        console.error(error);
        return false;
    }
}

export async function restoreUser(id: string): Promise<boolean> {
    try {
        // Restore user to 'Active' status and clear deletion info
        const result = await runStatement("UPDATE User SET status = 'Active', deletionReason = NULL, deletedAt = NULL WHERE id = ?", [id]);
        return (result.changes ?? 0) > 0;
    } catch (error) {
        console.error("Failed to restore user:", error);
        return false;
    }
}

export async function permanentlyDeleteUser(id: string): Promise<boolean> {
    try {
        const result = await runStatement('DELETE FROM User WHERE id = ?', [id]);
        return (result.changes ?? 0) > 0;
    } catch (error) {
        console.error("Failed to permanently delete user:", error);
        return false;
    }
}
