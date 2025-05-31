const helmet = require("helmet")
const cors = require("cors")
const compression = require("compression")
const express = require("express")

const setupSecurity = (app) => {
  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'", "https://api.stripe.com"],
          frameSrc: ["'self'", "https://js.stripe.com"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  )

  // CORS configuration
  app.use(
    cors({
      origin: [process.env.FRONTEND_URL, "http://localhost:3000"],
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "stripe-signature"],
    }),
  )

  // Compression
  app.use(compression())

  // Request size limits
  app.use(express.json({ limit: "10mb" }))
  app.use(express.urlencoded({ extended: true, limit: "10mb" }))
}

module.exports = setupSecurity
