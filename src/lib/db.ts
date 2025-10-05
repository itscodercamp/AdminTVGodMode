
'use server';

import sqlite3 from 'sqlite3';
import { open, type Database } from 'sqlite';
import path from 'path';
import bcrypt from 'bcryptjs';

// This is a singleton to ensure we only have one database connection.
let db: Database<sqlite3.Database, sqlite3.Statement> | null = null;

async function getDb() {
  if (!db) {
    // Use the SQLITE_PATH from environment variable if it exists, otherwise default to dev.db in the project root.
    // This makes the database path configurable for different environments (like Docker).
    const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'dev.db');
    
    console.log(`Database path: ${dbPath}`);
    try {
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database,
        });
        console.log("Database connection established.");
    } catch(err) {
        console.error("Failed to open database:", err);
        throw err;
    }
  }
  return db;
}


async function initializeDb() {
  const db = await getDb();
  console.log("Running database migrations...");

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
          verified INTEGER,
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
            FOREIGN KEY (vehicleId) REFERENCES MarketplaceVehicle(id) ON DELETE CASCADE,
            FOREIGN KEY (userId) REFERENCES MarketplaceUser(id) ON DELETE CASCADE
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
    console.log("Default admin user created.");
  }
  
  console.log("Database initialized successfully.");
}

// Run initialization once on server start
initializeDb().catch(err => {
    console.error("Failed to initialize database on startup:", err);
    process.exit(1);
});


// Helper function to run a query that expects multiple rows
export async function runQuery<T>(sql: string, params: any[] = []): Promise<T[]> {
    const db = await getDb();
    return db.all<T[]>(sql, params);
}

// Helper function to execute a statement (INSERT, UPDATE, DELETE)
export async function runStatement(sql: string, params: any[] = []): Promise<{ changes?: number }> {
    const db = await getDb();
    const result = await db.run(sql, params);
    return { changes: result.changes };
}

// Function to fetch a single row
export async function getSingleRow<T>(sql: string, params: any[] = []): Promise<T | undefined> {
    const db = await getDb();
    return db.get<T>(sql, params);
}

    