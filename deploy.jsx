#!/usr/bin/env node

/**
 * Sugi Parfume Enterprise Deployment Script
 *
 * This script automates the deployment process for the Sugi Parfume platform.
 * It performs pre-deployment checks, database migrations, and deployment to Vercel.
 */

const { execSync } = require("child_process")
const fs = require("fs")
const path = require("path")
const readline = require("readline")

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

// Configuration
const config = {
  requiredEnvVars: [
    "MONGODB_URI",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASS",
    "FRONTEND_URL",
    "SUPPORT_EMAIL",
    "REACT_APP_API_URL",
    "REACT_APP_WS_URL",
    "JWT_SECRET",
    "PORT",
    "REDIS_URL",
  ],
  vercelProjectName: "sugi-parfume",
  production: process.argv.includes("--prod"),
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
 * Check if all required environment variables are set
 */
function checkEnvironmentVariables() {
  log("Checking environment variables...", "step")

  const missingVars = []

  for (const envVar of config.requiredEnvVars) {
    if (!process.env[envVar]) {
      missingVars.push(envVar)
    }
  }

  if (missingVars.length > 0) {
    log(`Missing environment variables: ${missingVars.join(", ")}`, "error")
    return false
  }

  log("All environment variables are set", "success")
  return true
}

/**
 * Run database migrations
 */
async function runMigrations() {
  log("Running database migrations...", "step")

  try {
    execSync("node scripts/migrate.js", { stdio: "inherit" })
    log("Database migrations completed successfully", "success")
    return true
  } catch (error) {
    log(`Failed to run database migrations: ${error.message}`, "error")
    return false
  }
}

/**
 * Build the client application
 */
async function buildClient() {
  log("Building client application...", "step")

  try {
    execSync("cd client && npm run build", { stdio: "inherit" })
    log("Client build completed successfully", "success")
    return true
  } catch (error) {
    log(`Failed to build client: ${error.message}`, "error")
    return false
  }
}

/**
 * Deploy to Vercel
 */
async function deployToVercel() {
  const deployCommand = config.production
    ? `vercel --prod --name ${config.vercelProjectName}`
    : `vercel --name ${config.vercelProjectName}`

  log(`Deploying to Vercel${config.production ? " (PRODUCTION)" : ""}...`, "step")

  try {
    execSync(deployCommand, { stdio: "inherit" })
    log("Deployment completed successfully", "success")
    return true
  } catch (error) {
    log(`Deployment failed: ${error.message}`, "error")
    return false
  }
}

/**
 * Run post-deployment verification
 */
async function verifyDeployment() {
  log("Running post-deployment verification...", "step")

  try {
    // Check API health endpoint
    log("Checking API health endpoint...", "info")
    const healthCheckUrl = `${process.env.REACT_APP_API_URL}/health`

    log(`Health check URL: ${healthCheckUrl}`, "info")
    log("Please verify the health check endpoint manually after deployment", "warning")

    return true
  } catch (error) {
    log(`Verification failed: ${error.message}`, "error")
    return false
  }
}

/**
 * Main deployment function
 */
async function deploy() {
  log(`${colors.bright}${colors.magenta}Sugi Parfume Enterprise Deployment${colors.reset}`, "info")
  log(`Mode: ${config.production ? "PRODUCTION" : "Preview"}`, "info")

  // Confirm deployment
  if (config.production) {
    rl.question(
      `${colors.yellow}You are about to deploy to PRODUCTION. Are you sure? (y/N)${colors.reset} `,
      (answer) => {
        if (answer.toLowerCase() !== "y") {
          log("Deployment cancelled", "warning")
          rl.close()
          return
        }

        runDeploymentSteps()
      },
    )
  } else {
    runDeploymentSteps()
  }
}

/**
 * Run all deployment steps
 */
async function runDeploymentSteps() {
  const steps = [
    { name: "Environment Variables Check", fn: checkEnvironmentVariables },
    { name: "Database Migrations", fn: runMigrations },
    { name: "Client Build", fn: buildClient },
    { name: "Vercel Deployment", fn: deployToVercel },
    { name: "Deployment Verification", fn: verifyDeployment },
  ]

  let success = true

  for (const step of steps) {
    log(`Starting: ${step.name}`, "step")
    const result = await step.fn()

    if (!result) {
      log(`Step failed: ${step.name}`, "error")
      success = false

      rl.question(`${colors.yellow}Continue despite errors? (y/N)${colors.reset} `, (answer) => {
        if (answer.toLowerCase() !== "y") {
          log("Deployment aborted", "error")
          rl.close()
          process.exit(1)
        }
      })
    }
  }

  if (success) {
    log(`${colors.bright}${colors.green}Deployment completed successfully!${colors.reset}`, "success")
    log(`Your Sugi Parfume platform is now live at: ${process.env.FRONTEND_URL}`, "success")
  } else {
    log(`${colors.bright}${colors.yellow}Deployment completed with warnings.${colors.reset}`, "warning")
    log("Please check the logs for details.", "warning")
  }

  rl.close()
}

// Start deployment
deploy()
