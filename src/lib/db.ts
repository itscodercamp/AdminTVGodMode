
'use server';

import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import bcrypt from 'bcryptjs';

// This is a singleton to ensure we only have one database connection.
let dbPromise: Promise<Database> | null = null;

async function runMigrations(db: Database) {
    // --- Inspection Table Migrations ---
    const inspectionTableInfo = await db.all("PRAGMA table_info(Inspection)");
    const inspectionColumns = inspectionTableInfo.map(c => c.name);

    if (!inspectionColumns.includes('fullName')) {
        try {
            await db.exec('ALTER TABLE Inspection RENAME COLUMN customerName TO fullName');
        } catch(e) {
            await db.exec('ALTER TABLE Inspection ADD COLUMN fullName TEXT');
        }
    }
    if (!inspectionColumns.includes('phoneNumber')) {
         try {
            await db.exec('ALTER TABLE Inspection RENAME COLUMN customerNumber TO phoneNumber');
        } catch(e) {
            await db.exec('ALTER TABLE Inspection ADD COLUMN phoneNumber TEXT');
        }
    }
     if (!inspectionColumns.includes('registrationNumber')) {
         try {
            await db.exec('ALTER TABLE Inspection RENAME COLUMN numberPlate TO registrationNumber');
        } catch(e) {
            await db.exec('ALTER TABLE Inspection ADD COLUMN registrationNumber TEXT');
        }
    }

    if (!inspectionColumns.includes('street')) await db.exec('ALTER TABLE Inspection ADD COLUMN street TEXT');
    if (!inspectionColumns.includes('city')) await db.exec('ALTER TABLE Inspection ADD COLUMN city TEXT');
    if (!inspectionColumns.includes('state')) await db.exec('ALTER TABLE Inspection ADD COLUMN state TEXT');
    if (!inspectionColumns.includes('pinCode')) await db.exec('ALTER TABLE Inspection ADD COLUMN pinCode TEXT');
    if (!inspectionColumns.includes('carYear')) await db.exec('ALTER TABLE Inspection ADD COLUMN carYear TEXT');
    if (!inspectionColumns.includes('inspectionType')) await db.exec('ALTER TABLE Inspection ADD COLUMN inspectionType TEXT');
    if (!inspectionColumns.includes('leadType')) await db.exec('ALTER TABLE Inspection ADD COLUMN leadType TEXT');
    if (!inspectionColumns.includes('dealerId')) await db.exec('ALTER TABLE Inspection ADD COLUMN dealerId TEXT');
    
    // --- MarketplaceVehicle Table Migrations ---
    const vehicleTableInfo = await db.all("PRAGMA table_info(MarketplaceVehicle)");
    const vehicleColumns = vehicleTableInfo.map(c => c.name);
    const vehicleColumnsToAdd = [
      { name: 'category', type: 'TEXT' },
      { name: 'imageUrl', type: 'TEXT' },
      { name: 'year', type: 'INTEGER' },
      { name: 'make', type: 'TEXT' },
      { name: 'model', type: 'TEXT' },
      { name: 'variant', type: 'TEXT' },
      { name: 'price', type: 'INTEGER' },
      { name: 'status', type: 'TEXT' },
      { name: 'verified', type: 'BOOLEAN' },
      { name: 'regYear', type: 'INTEGER' },
      { name: 'mfgYear', type: 'INTEGER' },
      { name: 'regNumber', type: 'TEXT' },
      { name: 'odometer', type: 'INTEGER' },
      { name: 'fuelType', type: 'TEXT' },
      { name: 'transmission', type: 'TEXT' },
      { name: 'rtoState', type: 'TEXT' },
      { name: 'ownership', type: 'TEXT' },
      { name: 'insurance', type: 'TEXT' },
      { name: 'serviceHistory', type: 'TEXT' },
      { name: 'color', type: 'TEXT' },
      { name: 'img_front', type: 'TEXT' },
      { name: 'img_front_right', type: 'TEXT' },
      { name: 'img_right', type: 'TEXT' },
      { name: 'img_back_right', type: 'TEXT' },
      { name: 'img_back', type: 'TEXT' },
      { name: 'img_open_dickey', type: 'TEXT' },
      { name: 'img_back_left', type: 'TEXT' },
      { name: 'img_left', type: 'TEXT' },
      { name: 'img_front_left', type: 'TEXT' },
      { name: 'img_open_bonnet', type: 'TEXT' },
      { name: 'img_dashboard', type: 'TEXT' },
      { name: 'img_right_front_door', type: 'TEXT' },
      { name: 'img_right_back_door', type: 'TEXT' },
      { name: 'img_tyre_1', type: 'TEXT' },
      { name: 'img_tyre_2', type: 'TEXT' },
      { name: 'img_tyre_3', type: 'TEXT' },
      { name: 'img_tyre_4', type: 'TEXT' },
      { name: 'img_tyre_optional', type: 'TEXT' },
      { name: 'img_engine', type: 'TEXT' },
      { name: 'img_roof', type: 'TEXT' },
      { name: 'createdAt', type: 'TEXT' },
      { name: 'updatedAt', type: 'TEXT' }
    ];

    for (const col of vehicleColumnsToAdd) {
        if (!vehicleColumns.includes(col.name)) {
            await db.exec(`ALTER TABLE MarketplaceVehicle ADD COLUMN ${col.name} ${col.type}`);
        }
    }
}


async function initializeDb(db: Database) {
  
  // Drop all tables to flush the database on every restart
  await db.exec(`DROP TABLE IF EXISTS MarketplaceInquiry;`);
  await db.exec(`DROP TABLE IF EXISTS MarketplaceContact;`);
  await db.exec(`DROP TABLE IF EXISTS MarketplaceVehicle;`);
  await db.exec(`DROP TABLE IF EXISTS MarketplaceBanner;`);
  await db.exec(`DROP TABLE IF EXISTS MarketplaceUser;`);
  await db.exec(`DROP TABLE IF EXISTS WebsiteInspectionRequest;`);
  await db.exec(`DROP TABLE IF EXISTS SellCarRequest;`);
  await db.exec(`DROP TABLE IF EXISTS Inspection;`);
  await db.exec(`DROP TABLE IF EXISTS ContactSubmission;`);
  await db.exec(`DROP TABLE IF EXISTS Dealer;`);
  await db.exec(`DROP TABLE IF EXISTS User;`);


  // Use IF NOT EXISTS to prevent errors on subsequent runs.
  await db.exec(`
    CREATE TABLE IF NOT EXISTS User (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        password TEXT NOT NULL,
        phone TEXT,
        dob TEXT NOT NULL,
        joiningDate TEXT NOT NULL,
        designation TEXT NOT NULL,
        status TEXT NOT NULL,
        deletionReason TEXT,
        deletedAt TEXT
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS Dealer (
        id TEXT PRIMARY KEY,
        dealershipName TEXT NOT NULL,
        ownerName TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        address TEXT NOT NULL,
        joiningDate TEXT NOT NULL,
        status TEXT NOT NULL,
        deletionReason TEXT,
        deletedAt TEXT
    );
  `);
  
  await db.exec(`
    CREATE TABLE IF NOT EXISTS ContactSubmission (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        date TEXT NOT NULL,
        status TEXT NOT NULL
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS Inspection (
        id TEXT PRIMARY KEY,
        fullName TEXT,
        phoneNumber TEXT,
        street TEXT,
        city TEXT,
        state TEXT,
        pinCode TEXT,
        vehicleMake TEXT,
        vehicleModel TEXT,
        registrationNumber TEXT,
        assignedToId TEXT,
        status TEXT,
        source TEXT,
        createdAt TEXT,
        leadType TEXT,
        dealerId TEXT,
        carYear TEXT,
        inspectionType TEXT
    );
  `);

    await db.exec(`
    CREATE TABLE IF NOT EXISTS SellCarRequest (
        id TEXT PRIMARY KEY,
        make TEXT,
        model TEXT,
        year TEXT,
        variant TEXT,
        fuelType TEXT,
        transmission TEXT,
        kmDriven TEXT,
        owners TEXT,
        registrationState TEXT,
        city TEXT,
        sellerName TEXT,
        phone TEXT,
        email TEXT,
        description TEXT,
        status TEXT NOT NULL,
        createdAt TEXT NOT NULL
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS WebsiteInspectionRequest (
        id TEXT PRIMARY KEY,
        fullName TEXT NOT NULL,
        phoneNumber TEXT NOT NULL,
        carMake TEXT NOT NULL,
        carModel TEXT NOT NULL,
        carYear TEXT,
        inspectionType TEXT,
        registrationNumber TEXT,
        street TEXT,
        city TEXT,
        state TEXT,
        pinCode TEXT,
        status TEXT NOT NULL,
        createdAt TEXT NOT NULL
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS MarketplaceVehicle (
        id TEXT PRIMARY KEY,
        category TEXT,
        imageUrl TEXT,
        year INTEGER,
        make TEXT,
        model TEXT,
        variant TEXT,
        price INTEGER,
        status TEXT,
        verified BOOLEAN,
        regYear INTEGER,
        mfgYear INTEGER,
        regNumber TEXT,
        odometer INTEGER,
        fuelType TEXT,
        transmission TEXT,
        rtoState TEXT,
        ownership TEXT,
        insurance TEXT,
        serviceHistory TEXT,
        color TEXT,
        img_front TEXT,
        img_front_right TEXT,
        img_right TEXT,
        img_back_right TEXT,
        img_back TEXT,
        img_open_dickey TEXT,
        img_back_left TEXT,
        img_left TEXT,
        img_front_left TEXT,
        img_open_bonnet TEXT,
        img_dashboard TEXT,
        img_right_front_door TEXT,
        img_right_back_door TEXT,
        img_tyre_1 TEXT,
        img_tyre_2 TEXT,
        img_tyre_3 TEXT,
        img_tyre_4 TEXT,
        img_tyre_optional TEXT,
        img_engine TEXT,
        img_roof TEXT,
        createdAt TEXT,
        updatedAt TEXT
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS MarketplaceBanner (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        imageUrl TEXT NOT NULL,
        status TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS MarketplaceUser (
        id TEXT PRIMARY KEY,
        userType TEXT NOT NULL,
        fullName TEXT NOT NULL,
        phone TEXT NOT NULL UNIQUE,
        email TEXT,
        password TEXT NOT NULL,
        dealershipName TEXT,
        dealershipType TEXT,
        city TEXT,
        state TEXT,
        pincode TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
    );
  `);
  
  await db.exec(`
    CREATE TABLE IF NOT EXISTS MarketplaceInquiry (
        id TEXT PRIMARY KEY,
        vehicleId TEXT NOT NULL,
        userId TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        status TEXT NOT NULL,
        FOREIGN KEY (vehicleId) REFERENCES MarketplaceVehicle(id),
        FOREIGN KEY (userId) REFERENCES MarketplaceUser(id)
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS MarketplaceContact (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        message TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        status TEXT NOT NULL
    );
  `);
  
    await runMigrations(db);

    // Add default admin user if not exists
    const adminUser = await db.get('SELECT * FROM User WHERE email = ?', 'trustedvehiclesofficial@gmail.com');
    if (!adminUser) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('5911@Trusted_Vehicles', salt);
        
        await db.run(
            'INSERT INTO User (id, email, name, password, phone, dob, joiningDate, designation, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                'admin-user-01',
                'trustedvehiclesofficial@gmail.com',
                'Admin',
                hashedPassword,
                '1234567890',
                new Date('1990-01-01').toISOString(),
                new Date().toISOString(),
                'Admin',
                'Active'
            ]
        );
    }

}


function getDbPromise() {
    if (!dbPromise) {
        dbPromise = (async () => {
            const dbPath = path.resolve(process.cwd(), 'dev.db');
            const db = await open({
                filename: dbPath,
                driver: sqlite3.Database
            });
            await initializeDb(db);
            return db;
        })();
    }
    return dbPromise;
}

// Helper function to run a single query
export async function runQuery<T>(sql: string, params: any[] = []): Promise<T[]> {
  const db = await getDbPromise();
  return db.all<T[]>(sql, params);
}

// Helper function to execute a statement (INSERT, UPDATE, DELETE)
export async function runStatement(sql: string, params: any[] = []): Promise<{ lastID?: number, changes?: number }> {
    const db = await getDbPromise();
    return db.run(sql, params);
}

// Function to fetch a single row
export async function getSingleRow<T>(sql: string, params: any[] = []): Promise<T | undefined> {
    const db = await getDbPromise();
    return db.get<T>(sql, params);
}

    

    