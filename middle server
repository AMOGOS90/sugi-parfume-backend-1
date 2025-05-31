const rateLimit = require("express-rate-limit")
const RedisStore = require("rate-limit-redis")
const Redis = require("ioredis")

// Create Redis client for rate limiting
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379")

// General API rate limiter
const apiLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Strict rate limiter for sensitive endpoints
const strictLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: "Too many attempts, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// AI recommendations rate limiter
const aiLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 AI requests per minute
  message: {
    error: "AI service rate limit exceeded, please wait before requesting more recommendations.",
  },
  standardHeaders: true,
  legacyHeaders: false,
})

module.exports = {
  apiLimiter,
  strictLimiter,
  aiLimiter,
}
