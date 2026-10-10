require('dotenv').config();
const { connectDB, disconnectDB, mongoose } = require('./src/config/db');

async function wipeDatabase() {
  console.log("Starting DB wipe script...");
  
  try {
    // 1. Connect to the database
    // This will automatically start the portable MongoMemoryServer if configured that way
    await connectDB();
    console.log("Connected to database successfully.");

    const db = mongoose.connection.db;
    
    // 2. Clear all data from other collections completely
    const collectionsToDrop = [
      "institutions",
      "batches",
      "attendances",
      "swimtests",
      "studentprofiles",
      "notifications",
      "otps"
    ];

    const existingCollections = (await db.listCollections().toArray()).map(c => c.name);

    for (const collName of collectionsToDrop) {
      if (existingCollections.includes(collName)) {
        const result = await db.collection(collName).deleteMany({});
        console.log(`Cleared ${result.deletedCount} documents from '${collName}'.`);
      } else {
        console.log(`Collection '${collName}' does not exist (skipping).`);
      }
    }

    // 3. Clear Users, but keep superadmin
    if (existingCollections.includes("users")) {
      const result = await db.collection("users").deleteMany({ role: { $ne: "superadmin" } });
      console.log(`Cleared ${result.deletedCount} non-superadmin documents from 'users'.`);
      
      const superadmins = await db.collection("users").countDocuments({ role: "superadmin" });
      console.log(`Kept ${superadmins} superadmin(s) in 'users'.`);
    }

    console.log("\nDatabase wipe complete! Clean state ready.");

  } catch (err) {
    console.error("An error occurred during database wipe:", err);
  } finally {
    // 4. Disconnect and shut down the memory server
    await disconnectDB();
    console.log("Disconnected from database. Exiting.");
    process.exit(0);
  }
}

wipeDatabase();
