#!/usr/bin/env node

/**
 * Sugi Parfume Enterprise Monitoring Script
 *
 * This script provides basic monitoring for the Sugi Parfume platform.
 * It checks API health, database connectivity, and Redis status.
 */

const axios = require("axios")
const mongoose = require("mongoose")
const Redis = require("ioredis")
const fs = require("fs")
const path = require("path")

// Configuration
const config = {
  apiUrl: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  mongoUri: process.env.MONGODB_URI,
  redisUrl: process.env.REDIS_URL,
  checkInterval: 5 * 60 * 1000, // 5 minutes
  logFile: path.join(__dirname, "../logs/monitoring.log"),
  alertThreshold: 3, // Number of consecutive failures before alerting
}

// Ensure logs directory exists
const logsDir = path.join(__dirname, "../logs")
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

// Initialize failure counters
const failures = {
  api: 0,
  database: 0,
  redis: 0,
}

/**
 * Log a message to file and console
 */
function log(message, type = "info") {
  const timestamp = new Date().toISOString()
  const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`

  console.log(logMessage)

  fs.appendFileSync(config.logFile, logMessage + "\n")
}

/**
 * Check API health
 */
async function checkApiHealth() {
  try {
    const response = await axios.get(`${config.apiUrl}/health`, { timeout: 5000 })

    if (response.status === 200 && response.data.status === "OK") {
      log("API health check passed")
      failures.api = 0
      return true
    } else {
      log(`API health check failed: Unexpected response - ${JSON.stringify(response.data)}`, "warning")
      failures.api++
      return false
    }
  } catch (error) {
    log(`API health check failed: ${error.message}`, "error")
    failures.api++
    return false
  }
}

/**
 * Check database connectivity
 */
async function checkDatabase() {
  try {
    await mongoose.connect(config.mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    })

    const status = mongoose.connection.readyState

    if (status === 1) {
      log("Database connectivity check passed")
      failures.database = 0
      await mongoose.connection.close()
      return true
    } else {
      log(`Database connectivity check failed: Connection state ${status}`, "warning")
      failures.database++
      return false
    }
  } catch (error) {
    log(`Database connectivity check failed: ${error.message}`, "error")
    failures.database++
    return false
  }
}

/**
 * Check Redis connectivity
 */
async function checkRedis() {
  const redis = new Redis(config.redisUrl, {
    connectTimeout: 5000,
    maxRetriesPerRequest: 1,
  })

  try {
    await redis.ping()
    log("Redis connectivity check passed")
    failures.redis = 0
    await redis.quit()
    return true
  } catch (error) {
    log(`Redis connectivity check failed: ${error.message}`, "error")
    failures.redis++
    await redis.quit()
    return false
  }
}

/**
 * Check for alerts
 */
function checkAlerts() {
  const alerts = []

  if (failures.api >= config.alertThreshold) {
    alerts.push(`API health check failed ${failures.api} times in a row`)
  }

  if (failures.database >= config.alertThreshold) {
    alerts.push(`Database connectivity check failed ${failures.database} times in a row`)
  }

  if (failures.redis >= config.alertThreshold) {
    alerts.push(`Redis connectivity check failed ${failures.redis} times in a row`)
  }

  if (alerts.length > 0) {
    sendAlert(alerts.join("\n"))
  }
}

/**
 * Send an alert
 */
function sendAlert(message) {
  log(`ALERT: ${message}`, "alert")

  // In a production environment, you would send an email, SMS, or notification
  // For now, we just log the alert
  console.error("\x1b[31m%s\x1b[0m", `ALERT: ${message}`)
}

/**
 * Run all checks
 */
async function runChecks() {
  log("Starting monitoring checks...")

  await checkApiHealth()
  await checkDatabase()
  await checkRedis()

  checkAlerts()

  log("Monitoring checks completed")
}

// Run checks immediately
runChecks()

// Schedule regular checks
setInterval(runChecks, config.checkInterval)

log(`Monitoring started with ${config.checkInterval / 1000 / 60} minute interval`)
