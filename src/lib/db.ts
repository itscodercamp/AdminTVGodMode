
'use server';

import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

// This is a singleton to ensure we only have one database connection pool.
let pool: Pool | null = null;

function getDbPool() {
    if (!pool) {
        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL environment variable is not set.');
        }
        console.log("Creating new PostgreSQL connection pool.");
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            // ssl: {
            //   rejectUnauthorized: false // Required for some cloud providers
            // }
        });
    }
    return pool;
}

async function initializeDb() {
  const client = await getDbPool().connect();
  try {
    console.log("Running database migrations for PostgreSQL...");

    await client.query(`
      CREATE TABLE IF NOT EXISTS "User" (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          password TEXT NOT NULL,
          phone TEXT,
          dob TEXT NOT NULL,
          "joiningDate" TEXT NOT NULL,
          designation TEXT NOT NULL,
          status TEXT NOT NULL,
          "deletionReason" TEXT,
          "deletedAt" TEXT
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "Dealer" (
          id TEXT PRIMARY KEY,
          "dealershipName" TEXT NOT NULL,
          "ownerName" TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT NOT NULL,
          address TEXT NOT NULL,
          "joiningDate" TEXT NOT NULL,
          status TEXT NOT NULL,
          "deletionReason" TEXT,
          "deletedAt" TEXT
      );
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS "ContactSubmission" (
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

    await client.query(`
      CREATE TABLE IF NOT EXISTS "Inspection" (
          id TEXT PRIMARY KEY,
          "fullName" TEXT,
          "phoneNumber" TEXT,
          street TEXT,
          city TEXT,
          state TEXT,
          "pinCode" TEXT,
          "vehicleMake" TEXT,
          "vehicleModel" TEXT,
          "registrationNumber" TEXT,
          "assignedToId" TEXT,
          status TEXT,
          source TEXT,
          "createdAt" TEXT,
          "leadType" TEXT,
          "dealerId" TEXT,
          "carYear" TEXT,
          "inspectionType" TEXT
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "SellCarRequest" (
          id TEXT PRIMARY KEY,
          make TEXT,
          model TEXT,
          year TEXT,
          variant TEXT,
          "fuelType" TEXT,
          transmission TEXT,
          "kmDriven" TEXT,
          owners TEXT,
          "registrationState" TEXT,
          city TEXT,
          "sellerName" TEXT,
          phone TEXT,
          email TEXT,
          description TEXT,
          status TEXT NOT NULL,
          "createdAt" TEXT NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "WebsiteInspectionRequest" (
          id TEXT PRIMARY KEY,
          "fullName" TEXT NOT NULL,
          "phoneNumber" TEXT NOT NULL,
          "carMake" TEXT NOT NULL,
          "carModel" TEXT NOT NULL,
          "carYear" TEXT,
          "inspectionType" TEXT,
          "registrationNumber" TEXT,
          street TEXT,
          city TEXT,
          state TEXT,
          "pinCode" TEXT,
          status TEXT NOT NULL,
          "createdAt" TEXT NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "MarketplaceVehicle" (
          id TEXT PRIMARY KEY,
          category TEXT,
          "imageUrl" TEXT,
          year INTEGER,
          make TEXT,
          model TEXT,
          variant TEXT,
          price INTEGER,
          status TEXT,
          verified BOOLEAN,
          "regYear" INTEGER,
          "mfgYear" INTEGER,
          "regNumber" TEXT,
          odometer INTEGER,
          "fuelType" TEXT,
          transmission TEXT,
          "rtoState" TEXT,
          ownership TEXT,
          insurance TEXT,
          "serviceHistory" TEXT,
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
          "createdAt" TEXT,
          "updatedAt" TEXT
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "MarketplaceBanner" (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          "imageUrl" TEXT NOT NULL,
          status TEXT NOT NULL,
          "createdAt" TEXT NOT NULL,
          "updatedAt" TEXT NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "MarketplaceUser" (
          id TEXT PRIMARY KEY,
          "userType" TEXT NOT NULL,
          "fullName" TEXT NOT NULL,
          phone TEXT NOT NULL UNIQUE,
          email TEXT,
          password TEXT NOT NULL,
          "dealershipName" TEXT,
          "dealershipType" TEXT,
          city TEXT,
          state TEXT,
          pincode TEXT,
          "createdAt" TEXT NOT NULL,
          "updatedAt" TEXT NOT NULL
      );
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS "MarketplaceInquiry" (
          id TEXT PRIMARY KEY,
          "vehicleId" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "createdAt" TEXT NOT NULL,
          status TEXT NOT NULL,
          FOREIGN KEY ("vehicleId") REFERENCES "MarketplaceVehicle"(id) ON DELETE CASCADE,
          FOREIGN KEY ("userId") REFERENCES "MarketplaceUser"(id) ON DELETE CASCADE
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "MarketplaceContact" (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          message TEXT NOT NULL,
          "createdAt" TEXT NOT NULL,
          status TEXT NOT NULL
      );
    `);

    // Add default admin user if not exists
    const adminUserRes = await client.query('SELECT * FROM "User" WHERE email = $1', ['trustedvehiclesofficial@gmail.com']);
    if (adminUserRes.rowCount === 0) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('5911@Trusted_Vehicles', salt);
        
        await client.query(
            'INSERT INTO "User" (id, email, name, password, phone, dob, "joiningDate", designation, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
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
  } catch (error) {
    console.error("Error initializing database:", error);
    // If initialization fails, it's a critical error.
    throw error;
  } finally {
    client.release();
  }
}

// Run initialization once on server start
initializeDb().catch(err => {
    console.error("Failed to initialize database on startup:", err);
    process.exit(1);
});


// Helper function to run a query that expects multiple rows
export async function runQuery<T>(sql: string, params: any[] = []): Promise<T[]> {
  const client = await getDbPool().connect();
  try {
    // Convert SQL `?` placeholders to PostgreSQL `$1, $2, ...` placeholders
    let paramIndex = 1;
    const preparedSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
    
    const result = await client.query(preparedSql, params);
    // Convert column names from snake_case (PostgreSQL) to camelCase (JavaScript)
    return result.rows.map(row => {
        const newRow: { [key: string]: any } = {};
        for (const key in row) {
            const camelCaseKey = key.replace(/([-_][a-z])/ig, ($1) => {
                return $1.toUpperCase()
                    .replace('-', '')
                    .replace('_', '');
            });
            newRow[camelCaseKey] = row[key];
        }
        return newRow as T;
    });
  } finally {
    client.release();
  }
}

// Helper function to execute a statement (INSERT, UPDATE, DELETE)
export async function runStatement(sql: string, params: any[] = []): Promise<{ changes?: number }> {
    const client = await getDbPool().connect();
    try {
        let paramIndex = 1;
        const preparedSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
        
        const result = await client.query(preparedSql, params);
        return { changes: result.rowCount ?? 0 };
    } finally {
        client.release();
    }
}


// Function to fetch a single row
export async function getSingleRow<T>(sql: string, params: any[] = []): Promise<T | undefined> {
    const rows = await runQuery<T>(sql, params);
    return rows[0];
}
