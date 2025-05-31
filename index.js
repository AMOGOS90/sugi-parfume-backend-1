const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const path = require("path")

// Import services and middleware
const setupSecurity = require("./middleware/security")
const { apiLimiter, strictLimiter, aiLimiter } = require("./middleware/rateLimiter")
const analyticsService = require("./services/AnalyticsService")
const cacheService = require("./services/CacheService")

// Import routes
const productRoutes = require("./routes/productRoutes")
const authRoutes = require("./routes/authRoutes")
const aiRoutes = require("./routes/aiRoutes")
const subscriptionRoutes = require("./routes/subscriptionRoutes")

const app = express()

// Setup security middleware
setupSecurity(app)

// Apply rate limiting
app.use("/api/", apiLimiter)
app.use("/api/auth/login", strictLimiter)
app.use("/api/auth/register", strictLimiter)
app.use("/api/ai/", aiLimiter)

// Analytics middleware
app.use((req, res, next) => {
  // Track API requests
  if (req.path.startsWith("/api/")) {
    const userId = req.user?.userId || "anonymous"
    analyticsService.trackEvent(userId, "api_request", {
      method: req.method,
      path: req.path,
      userAgent: req.get("User-Agent"),
      ip: req.ip,
    })
  }
  next()
})

// Database connection with retry logic
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || "mongodb://localhost/sugi_parfume"
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })
    console.log("MongoDB connected successfully")
  } catch (error) {
    console.error("MongoDB connection error:", error)
    // Retry connection after 5 seconds
    setTimeout(connectDB, 5000)
  }
}

connectDB()

// Routes
app.use("/api/products", productRoutes)
app.use("/api/auth", authRoutes)
app.use("/api/ai", aiRoutes)
app.use("/api/subscription", subscriptionRoutes)

// Health check endpoint
app.get("/api/health", async (req, res) => {
  const health = {
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    services: {
      database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      cache: await cacheService.getStats(),
      memory: {
        used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
        total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
      },
    },
  }

  res.json(health)
})

// Analytics endpoint
app.get("/api/analytics/dashboard", async (req, res) => {
  try {
    const timeRange = req.query.timeRange || "7d"
    const data = analyticsService.getDashboardData(timeRange)
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/build")))

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/build", "index.html"))
  })
}

// Global error handler
app.use((error, req, res, next) => {
  console.error("Global error handler:", error)

  // Track errors
  const userId = req.user?.userId || "anonymous"
  analyticsService.trackEvent(userId, "error", {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  })

  res.status(error.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === "production" ? "Internal server error" : error.message,
    ...(process.env.NODE_ENV !== "production" && { stack: error.stack }),
  })
})

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully")
  await mongoose.connection.close()
  process.exit(0)
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`🚀 Sugi Parfume server running on port ${PORT}`)
  console.log(`📊 Environment: ${process.env.NODE_ENV}`)
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL}`)
})

module.exports = app
