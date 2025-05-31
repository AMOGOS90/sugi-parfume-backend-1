const express = require("express")
const router = express.Router()
const aiService = require("../services/AIRecommendationService")
const authenticateToken = require("../middleware/auth")

// Get personalized recommendations
router.post("/recommendations", authenticateToken, async (req, res) => {
  try {
    const { preferences } = req.body
    const userId = req.user.userId

    const recommendations = await aiService.generateRecommendations(preferences, userId)

    res.json({
      success: true,
      recommendations,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error generating recommendations:", error)
    res.status(500).json({
      success: false,
      message: "Failed to generate recommendations",
      error: error.message,
    })
  }
})

// Record user interaction for learning
router.post("/interaction", authenticateToken, async (req, res) => {
  try {
    const { fragranceId, interactionType, rating } = req.body
    const userId = req.user.userId

    await aiService.recordInteraction(userId, fragranceId, interactionType, rating)

    res.json({
      success: true,
      message: "Interaction recorded successfully",
    })
  } catch (error) {
    console.error("Error recording interaction:", error)
    res.status(500).json({
      success: false,
      message: "Failed to record interaction",
      error: error.message,
    })
  }
})

// Get user's fragrance profile
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId
    const profile = aiService.userProfiles.get(userId) || {
      preferences: [],
      interactions: [],
      purchases: [],
    }

    // Calculate insights
    const insights = {
      favoriteNotes: aiService.calculateFavoriteNotes(userId),
      preferredIntensity: aiService.calculatePreferredIntensity(userId),
      seasonalPreferences: aiService.calculateSeasonalPreferences(userId),
      totalInteractions: profile.interactions.length,
      profileCompleteness: aiService.calculateProfileCompleteness(userId),
    }

    res.json({
      success: true,
      profile,
      insights,
    })
  } catch (error) {
    console.error("Error fetching user profile:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch user profile",
      error: error.message,
    })
  }
})

// Update user preferences
router.put("/preferences", authenticateToken, async (req, res) => {
  try {
    const { preferences } = req.body
    const userId = req.user.userId

    aiService.updateUserProfile(userId, preferences)

    res.json({
      success: true,
      message: "Preferences updated successfully",
    })
  } catch (error) {
    console.error("Error updating preferences:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update preferences",
      error: error.message,
    })
  }
})

// Get trending fragrances
router.get("/trending", async (req, res) => {
  try {
    const trending = await aiService.getTrendingFragrances()

    res.json({
      success: true,
      trending,
    })
  } catch (error) {
    console.error("Error fetching trending fragrances:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch trending fragrances",
      error: error.message,
    })
  }
})

// Get similar users (for collaborative filtering insights)
router.get("/similar-users", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId
    const similarUsers = aiService.findSimilarUsers(userId)

    res.json({
      success: true,
      similarUsers: similarUsers.map((u) => ({
        similarity: u.similarity,
        // Don't expose actual user IDs for privacy
        anonymizedId: `user_${u.userId.toString().slice(-4)}`,
      })),
    })
  } catch (error) {
    console.error("Error finding similar users:", error)
    res.status(500).json({
      success: false,
      message: "Failed to find similar users",
      error: error.message,
    })
  }
})

module.exports = router
