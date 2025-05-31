#!/usr/bin/env node

/**
 * Sugi Parfume Database Migration Script
 *
 * This script handles database migrations for the Sugi Parfume platform.
 */

const mongoose = require("mongoose")
const fs = require("fs")
const path = require("path")

// Configuration
const config = {
  mongoUri: process.env.MONGODB_URI || "mongodb://localhost/sugi_parfume",
  migrationsDir: path.join(__dirname, "../migrations"),
  migrationCollection: "migrations",
}

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
}

/**
 * Print a formatted message to the console
 */
function log(message, type = "info") {
  const timestamp = new Date().toISOString().split("T")[1].split(".")[0]
  let prefix = ""

  switch (type) {
    case "success":
      prefix = `${colors.green}✓${colors.reset} `
      break
    case "error":
      prefix = `${colors.red}✗${colors.reset} `
      break
    case "warning":
      prefix = `${colors.yellow}!${colors.reset} `
      break
    case "info":
      prefix = `${colors.blue}i${colors.reset} `
      break
    case "step":
      prefix = `${colors.cyan}→${colors.reset} `
      break
  }

  console.log(`[${timestamp}] ${prefix}${message}`)
}

/**
 * Connect to the database
 */
async function connectToDatabase() {
  try {
    await mongoose.connect(config.mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    log("Connected to database", "success")
    return true
  } catch (error) {
    log(`Failed to connect to database: ${error.message}`, "error")
    return false
  }
}

/**
 * Get migration model
 */
function getMigrationModel() {
  const MigrationSchema = new mongoose.Schema({
    name: String,
    appliedAt: Date,
  })

  return mongoose.model("Migration", MigrationSchema, config.migrationCollection)
}

/**
 * Get applied migrations
 */
async function getAppliedMigrations() {
  const Migration = getMigrationModel()
  return await Migration.find().sort({ appliedAt: 1 })
}

/**
 * Get available migrations
 */
function getAvailableMigrations() {
  // Create migrations directory if it doesn't exist
  if (!fs.existsSync(config.migrationsDir)) {
    fs.mkdirSync(config.migrationsDir, { recursive: true })

    // Create sample migration
    const sampleMigration = path.join(config.migrationsDir, "001-initial-schema.js")
    if (!fs.existsSync(sampleMigration)) {
      const sampleContent = `
/**
 * Migration: 001-initial-schema
 * Description: Initial database schema setup
 */

module.exports = {
  async up(db) {
    // Create collections and indexes
    await db.createCollection('users');
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    
    await db.createCollection('products');
    await db.collection('products').createIndex({ name: 1 });
    
    await db.createCollection('subscriptions');
    await db.collection('subscriptions').createIndex({ userId: 1 });
  },
  
  async down(db) {
    await db.collection('users').drop();
    await db.collection('products').drop();
    await db.collection('subscriptions').drop();
  }
};
`
      fs.writeFileSync(sampleMigration, sampleContent)
    }
  }

  const files = fs
    .readdirSync(config.migrationsDir)
    .filter((file) => file.endsWith(".js"))
    .sort()

  return files.map((file) => ({
    name: file.replace(".js", ""),
    path: path.join(config.migrationsDir, file),
  }))
}

/**
 * Apply migrations
 */
async function applyMigrations() {
  log("Starting database migrations...", "step")

  const connected = await connectToDatabase()
  if (!connected) {
    return false
  }

  const appliedMigrations = await getAppliedMigrations()
  const availableMigrations = getAvailableMigrations()

  const appliedNames = appliedMigrations.map((m) => m.name)
  const pendingMigrations = availableMigrations.filter((m) => !appliedNames.includes(m.name))

  if (pendingMigrations.length === 0) {
    log("No pending migrations", "info")
    await mongoose.connection.close()
    return true
  }

  log(`Found ${pendingMigrations.length} pending migrations`, "info")

  const Migration = getMigrationModel()
  const db = mongoose.connection.db

  for (const migration of pendingMigrations) {
    log(`Applying migration: ${migration.name}`, "step")

    try {
      const migrationModule = require(migration.path)

      if (typeof migrationModule.up !== "function") {
        log(`Migration ${migration.name} does not have an 'up' function`, "error")
        continue
      }

      await migrationModule.up(db)

      await Migration.create({
        name: migration.name,
        appliedAt: new Date(),
      })

      log(`Migration ${migration.name} applied successfully`, "success")
    } catch (error) {
      log(`Failed to apply migration ${migration.name}: ${error.message}`, "error")
      await mongoose.connection.close()
      return false
    }
  }

  log("All migrations applied successfully", "success")
  await mongoose.connection.close()
  return true
}

/**
 * Create a new migration
 */
function createMigration(name) {
  if (!name) {
    log("Migration name is required", "error")
    return false
  }

  // Format name with timestamp and slug
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:T.Z]/g, "")
    .substring(0, 14)
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
  const fileName = `${timestamp}-${slug}.js`

  const migrationPath = path.join(config.migrationsDir, fileName)

  const template = `
/**
 * Migration: ${fileName}
 * Description: ${name}
 */

module.exports = {
  async up(db) {
    // TODO: Implement migration
  },
  
  async down(db) {
    // TODO: Implement rollback
  }
};
`

  if (!fs.existsSync(config.migrationsDir)) {
    fs.mkdirSync(config.migrationsDir, { recursive: true })
  }

  fs.writeFileSync(migrationPath, template)
  log(`Created migration: ${fileName}`, "success")
  return true
}

/**
 * Main function
 */
async function main() {
  const command = process.argv[2]

  switch (command) {
    case "create":
      const name = process.argv[3]
      createMigration(name)
      break

    case "status":
      await connectToDatabase()
      const appliedMigrations = await getAppliedMigrations()
      const availableMigrations = getAvailableMigrations()

      log(`${colors.bright}Migration Status${colors.reset}`, "info")
      log(`Applied migrations: ${appliedMigrations.length}`, "info")
      log(`Available migrations: ${availableMigrations.length}`, "info")

      const appliedNames = appliedMigrations.map((m) => m.name)
      const pendingMigrations = availableMigrations.filter((m) => !appliedNames.includes(m.name))

      log(`Pending migrations: ${pendingMigrations.length}`, "info")

      if (pendingMigrations.length > 0) {
        log("Pending migrations:", "info")
        pendingMigrations.forEach((m) => log(`  - ${m.name}`, "info"))
      }

      await mongoose.connection.close()
      break

    default:
      await applyMigrations()
      break
  }
}

// Run the script
main().catch((error) => {
  log(`Unhandled error: ${error.message}`, "error")
  process.exit(1)
})
