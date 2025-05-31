const Redis = require("ioredis")

class CacheService {
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379")
    this.defaultTTL = 3600 // 1 hour
  }

  async get(key) {
    try {
      const value = await this.redis.get(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error("Cache get error:", error)
      return null
    }
  }

  async set(key, value, ttl = this.defaultTTL) {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(value))
      return true
    } catch (error) {
      console.error("Cache set error:", error)
      return false
    }
  }

  async del(key) {
    try {
      await this.redis.del(key)
      return true
    } catch (error) {
      console.error("Cache delete error:", error)
      return false
    }
  }

  async exists(key) {
    try {
      const result = await this.redis.exists(key)
      return result === 1
    } catch (error) {
      console.error("Cache exists error:", error)
      return false
    }
  }

  // Cache recommendations for users
  async cacheRecommendations(userId, recommendations) {
    const key = `recommendations:${userId}`
    await this.set(key, recommendations, 1800) // 30 minutes
  }

  async getCachedRecommendations(userId) {
    const key = `recommendations:${userId}`
    return await this.get(key)
  }

  // Cache user profiles
  async cacheUserProfile(userId, profile) {
    const key = `profile:${userId}`
    await this.set(key, profile, 3600) // 1 hour
  }

  async getCachedUserProfile(userId) {
    const key = `profile:${userId}`
    return await this.get(key)
  }

  // Cache fragrance data
  async cacheFragranceData(fragranceId, data) {
    const key = `fragrance:${fragranceId}`
    await this.set(key, data, 7200) // 2 hours
  }

  async getCachedFragranceData(fragranceId) {
    const key = `fragrance:${fragranceId}`
    return await this.get(key)
  }

  // Invalidate user-related caches
  async invalidateUserCache(userId) {
    const keys = [`recommendations:${userId}`, `profile:${userId}`]
    for (const key of keys) {
      await this.del(key)
    }
  }

  // Get cache statistics
  async getStats() {
    try {
      const info = await this.redis.info("memory")
      const keyspace = await this.redis.info("keyspace")
      return {
        memory: info,
        keyspace: keyspace,
        connected: true,
      }
    } catch (error) {
      return {
        connected: false,
        error: error.message,
      }
    }
  }
}

module.exports = new CacheService()
