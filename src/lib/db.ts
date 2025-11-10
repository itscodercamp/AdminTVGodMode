
'use server';

import sqlite3 from 'sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';

// --- Start of New SQLite3 Wrapper ---

// Use verbose mode for better debugging in development
const db_path = process.env.SQLITE_PATH || path.join(process.cwd(), 'dev.db');
const db = new sqlite3.Database(db_path, (err) => {
    if (err) {
        console.error('Failed to open database:', err.message);
    } else {
        console.log(`Database connection established to: ${db_path}`);
        // Enable foreign key support
        db.run('PRAGMA foreign_keys = ON;', (fk_err) => {
          if(fk_err) {
            console.error('Failed to enable foreign keys:', fk_err.message);
          } else {
            console.log("Foreign key support enabled.");
          }
        });
    }
});

/**
 * Executes a query that returns multiple rows.
 * @param sql The SQL query string.
 * @param params The parameters for the query.
 * @returns A promise that resolves with an array of rows.
 */
function runQuery<T>(sql: string, params: any[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                console.error('DB Query Error:', err.message);
                reject(err);
            } else {
                resolve(rows as T[]);
            }
        });
    });
}

/**
 * Executes a statement (INSERT, UPDATE, DELETE).
 * @param sql The SQL query string.
 * @param params The parameters for the query.
 * @returns A promise that resolves with the number of rows changed.
 */
function runStatement(sql: string, params: any[] = []): Promise<{ changes?: number }> {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) {
                console.error('DB Statement Error:', err.message);
                reject(err);
            } else {
                resolve({ changes: this.changes });
            }
        });
    });
}

/**
 * Executes a query that returns a single row.
 * @param sql The SQL query string.
 * @param params The parameters for the query.
 * @returns A promise that resolves with a single row or undefined.
 */
function getSingleRow<T>(sql: string, params: any[] = []): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) {
                console.error('DB getSingleRow Error:', err.message);
                reject(err);
            } else {
                resolve(row as T | undefined);
            }
        });
    });
}

// --- End of New SQLite3 Wrapper ---


async function initializeDb() {
  console.log("Running database migrations...");

  // Using a simplified exec-like function with runStatement
  const exec = async (sql: string) => runStatement(sql);

  await exec(`
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
  
  await exec(`
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

  await exec(`
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
  
  await exec(`
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

   await exec(`
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
    
    await exec(`
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

    await exec(`
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

    await exec(`
      CREATE TABLE IF NOT EXISTS MarketplaceBanner (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          imageUrl TEXT NOT NULL,
          status TEXT NOT NULL,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
      );
    `);

    await exec(`
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

    await exec(`
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

    await exec(`
        CREATE TABLE IF NOT EXISTS MarketplaceContact (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            message TEXT NOT NULL,
            createdAt TEXT NOT NULL,
            status TEXT NOT NULL
        );
    `);
    
    await exec(`
        CREATE TABLE IF NOT EXISTS LoanRequest (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            email TEXT NOT NULL,
            make TEXT NOT NULL,
            model TEXT NOT NULL,
            variant TEXT,
            panNumber TEXT NOT NULL,
            aadharNumber TEXT NOT NULL,
            status TEXT NOT NULL,
            createdAt TEXT NOT NULL
        );
    `);

    await exec(`
        CREATE TABLE IF NOT EXISTS InsuranceRenewal (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            registrationNumber TEXT NOT NULL,
            insuranceType TEXT NOT NULL,
            status TEXT NOT NULL,
            createdAt TEXT NOT NULL
        );
    `);

    await exec(`
        CREATE TABLE IF NOT EXISTS PDIInspection (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            email TEXT NOT NULL,
            city TEXT NOT NULL,
            make TEXT NOT NULL,
            model TEXT NOT NULL,
            status TEXT NOT NULL,
            createdAt TEXT NOT NULL
        );
    `);


  // Add default admin user if not exists
  const adminUser = await getSingleRow('SELECT * FROM User WHERE email = ?', ['trustedvehiclesofficial@gmail.com']);
  if (!adminUser) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('5911@Trusted_Vehicles', salt);
    
    await runStatement(
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

// Re-export the new wrapper functions
export { runQuery, runStatement, getSingleRow };
