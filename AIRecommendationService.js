const tf = require("@tensorflow/tfjs-node")
const natural = require("natural")

class AIRecommendationService {
  constructor() {
    this.model = null
    this.vectorizer = new natural.TfIdf()
    this.userProfiles = new Map()
    this.fragranceDatabase = this.initializeFragranceDatabase()
    this.loadModel()
  }

  async loadModel() {
    try {
      // In production, load from cloud storage
      this.model = await tf.loadLayersModel("file://./models/fragrance-recommendation-model.json")
      console.log("AI Recommendation model loaded successfully")
    } catch (error) {
      console.log("Model not found, using rule-based recommendations")
      this.model = null
    }
  }

  initializeFragranceDatabase() {
    return [
      {
        id: 1,
        name: "Sugi Classic",
        notes: ["cedar", "bergamot", "sandalwood", "citrus", "woody"],
        intensity: 65,
        longevity: 8,
        sillage: 7,
        season: ["spring", "fall"],
        occasion: ["daily", "work"],
        price: 180,
        popularity: 0.85,
        reviews: 4.6,
        ingredients: {
          top: ["bergamot", "yuzu", "pink_pepper"],
          heart: ["japanese_cedar", "hinoki"],
          base: ["sandalwood", "vetiver"],
        },
      },
      {
        id: 2,
        name: "Evening Elegance",
        notes: ["rose", "amber", "vanilla", "floral", "sweet"],
        intensity: 80,
        longevity: 10,
        sillage: 9,
        season: ["fall", "winter"],
        occasion: ["evening", "special_events"],
        price: 240,
        popularity: 0.78,
        reviews: 4.8,
        ingredients: {
          top: ["bergamot", "blackcurrant"],
          heart: ["rose", "jasmine", "peony"],
          base: ["amber", "vanilla", "musk"],
        },
      },
      {
        id: 3,
        name: "Fresh Breeze",
        notes: ["lemon", "lavender", "musk", "fresh", "citrus"],
        intensity: 45,
        longevity: 6,
        sillage: 5,
        season: ["spring", "summer"],
        occasion: ["daily", "sport"],
        price: 120,
        popularity: 0.92,
        reviews: 4.4,
        ingredients: {
          top: ["lemon", "lime", "mint"],
          heart: ["lavender", "geranium"],
          base: ["white_musk", "cedar"],
        },
      },
    ]
  }

  async generateRecommendations(userPreferences, userId, limit = 5) {
    try {
      // Update user profile
      this.updateUserProfile(userId, userPreferences)

      let recommendations = []

      if (this.model) {
        // Use ML model for recommendations
        recommendations = await this.mlBasedRecommendations(userPreferences, userId, limit)
      } else {
        // Use advanced rule-based system
        recommendations = this.ruleBasedRecommendations(userPreferences, userId, limit)
      }

      // Apply collaborative filtering
      recommendations = this.applyCollaborativeFiltering(recommendations, userId)

      // Calculate confidence scores
      recommendations = recommendations.map((rec) => ({
        ...rec,
        confidence: this.calculateConfidence(rec, userPreferences),
        explanation: this.generateExplanation(rec, userPreferences),
      }))

      // Sort by confidence and return top results
      return recommendations.sort((a, b) => b.confidence - a.confidence).slice(0, limit)
    } catch (error) {
      console.error("Error generating recommendations:", error)
      return this.getFallbackRecommendations(limit)
    }
  }

  ruleBasedRecommendations(preferences, userId, limit) {
    const scores = this.fragranceDatabase.map((fragrance) => {
      let score = 0
      const factors = []

      // Season matching (weight: 25%)
      if (preferences.season && fragrance.season.includes(preferences.season.toLowerCase())) {
        score += 25
        factors.push(`Perfect for ${preferences.season}`)
      }

      // Occasion matching (weight: 20%)
      if (preferences.occasion && fragrance.occasion.includes(preferences.occasion.toLowerCase().replace(" ", "_"))) {
        score += 20
        factors.push(`Ideal for ${preferences.occasion}`)
      }

      // Intensity matching (weight: 15%)
      const intensityDiff = Math.abs(fragrance.intensity - preferences.intensity)
      const intensityScore = Math.max(0, 15 - intensityDiff / 10)
      score += intensityScore
      if (intensityScore > 10) {
        factors.push(`Perfect intensity level`)
      }

      // Note preferences matching (weight: 30%)
      if (preferences.favoriteNotes && preferences.favoriteNotes.length > 0) {
        const matchingNotes = fragrance.notes.filter((note) =>
          preferences.favoriteNotes.some(
            (prefNote) =>
              note.toLowerCase().includes(prefNote.toLowerCase()) ||
              prefNote.toLowerCase().includes(note.toLowerCase()),
          ),
        )
        const noteScore = (matchingNotes.length / preferences.favoriteNotes.length) * 30
        score += noteScore
        if (matchingNotes.length > 0) {
          factors.push(`Contains your favorite ${matchingNotes.join(", ")} notes`)
        }
      }

      // Price range matching (weight: 10%)
      if (preferences.priceRange) {
        const priceScore = this.calculatePriceScore(fragrance.price, preferences.priceRange)
        score += priceScore
        if (priceScore > 5) {
          factors.push(`Within your budget`)
        }
      }

      return {
        ...fragrance,
        score: Math.min(100, score),
        matchingFactors: factors,
      }
    })

    return scores.filter((item) => item.score > 30)
  }

  async mlBasedRecommendations(preferences, userId, limit) {
    // Convert preferences to tensor
    const inputTensor = this.preprocessPreferences(preferences)

    // Get predictions from model
    const predictions = await this.model.predict(inputTensor).data()

    // Map predictions to fragrances
    return this.fragranceDatabase.map((fragrance, index) => ({
      ...fragrance,
      score: predictions[index] * 100,
      matchingFactors: ["AI-powered recommendation based on your profile"],
    }))
  }

  applyCollaborativeFiltering(recommendations, userId) {
    // Find similar users based on preferences
    const similarUsers = this.findSimilarUsers(userId)

    // Boost scores for fragrances liked by similar users
    return recommendations.map((rec) => {
      const boost = this.calculateCollaborativeBoost(rec.id, similarUsers)
      return {
        ...rec,
        score: Math.min(100, rec.score + boost),
        collaborativeBoost: boost,
      }
    })
  }

  calculateConfidence(recommendation, preferences) {
    let confidence = recommendation.score

    // Boost confidence based on popularity and reviews
    confidence += recommendation.popularity * 10
    confidence += (recommendation.reviews - 3) * 5 // Boost for ratings above 3

    // Reduce confidence for very expensive items if budget is limited
    if (preferences.priceRange && preferences.priceRange.includes("Under")) {
      if (recommendation.price > 150) {
        confidence -= 15
      }
    }

    return Math.max(0, Math.min(100, confidence))
  }

  generateExplanation(recommendation, preferences) {
    const explanations = []

    if (recommendation.matchingFactors) {
      explanations.push(...recommendation.matchingFactors)
    }

    if (recommendation.reviews >= 4.5) {
      explanations.push("Highly rated by customers")
    }

    if (recommendation.popularity > 0.8) {
      explanations.push("Popular choice among users")
    }

    if (recommendation.collaborativeBoost > 5) {
      explanations.push("Loved by users with similar preferences")
    }

    return explanations.join(". ") + "."
  }

  updateUserProfile(userId, preferences) {
    const existingProfile = this.userProfiles.get(userId) || {
      preferences: [],
      interactions: [],
      purchases: [],
    }

    existingProfile.preferences.push({
      ...preferences,
      timestamp: new Date(),
    })

    // Keep only last 10 preference sets
    if (existingProfile.preferences.length > 10) {
      existingProfile.preferences = existingProfile.preferences.slice(-10)
    }

    this.userProfiles.set(userId, existingProfile)
  }

  calculatePriceScore(price, priceRange) {
    const ranges = {
      "Under $100": [0, 100],
      "$100-200": [100, 200],
      "$200-300": [200, 300],
      "Above $300": [300, 1000],
    }

    const [min, max] = ranges[priceRange] || [0, 1000]
    return price >= min && price <= max ? 10 : 0
  }

  findSimilarUsers(userId) {
    // Simplified collaborative filtering
    const userProfile = this.userProfiles.get(userId)
    if (!userProfile) return []

    const similarUsers = []
    for (const [otherUserId, otherProfile] of this.userProfiles) {
      if (otherUserId !== userId) {
        const similarity = this.calculateUserSimilarity(userProfile, otherProfile)
        if (similarity > 0.6) {
          similarUsers.push({ userId: otherUserId, similarity })
        }
      }
    }

    return similarUsers.sort((a, b) => b.similarity - a.similarity).slice(0, 5)
  }

  calculateUserSimilarity(profile1, profile2) {
    // Simple cosine similarity based on preferences
    if (!profile1.preferences.length || !profile2.preferences.length) return 0

    const pref1 = profile1.preferences[profile1.preferences.length - 1]
    const pref2 = profile2.preferences[profile2.preferences.length - 1]

    let similarity = 0
    let factors = 0

    // Compare seasons
    if (pref1.season === pref2.season) {
      similarity += 0.2
    }
    factors++

    // Compare occasions
    if (pref1.occasion === pref2.occasion) {
      similarity += 0.2
    }
    factors++

    // Compare intensity (within 20 points)
    if (Math.abs(pref1.intensity - pref2.intensity) <= 20) {
      similarity += 0.3
    }
    factors++

    // Compare favorite notes
    if (pref1.favoriteNotes && pref2.favoriteNotes) {
      const commonNotes = pref1.favoriteNotes.filter((note) => pref2.favoriteNotes.includes(note))
      similarity += (commonNotes.length / Math.max(pref1.favoriteNotes.length, pref2.favoriteNotes.length)) * 0.3
    }
    factors++

    return similarity / factors
  }

  calculateCollaborativeBoost(fragranceId, similarUsers) {
    // This would query actual user interaction data in production
    return Math.random() * 10 // Simplified for demo
  }

  getFallbackRecommendations(limit) {
    return this.fragranceDatabase
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit)
      .map((fragrance) => ({
        ...fragrance,
        score: fragrance.popularity * 100,
        confidence: fragrance.popularity * 100,
        explanation: "Popular choice among all users",
        matchingFactors: ["Trending fragrance"],
      }))
  }

  preprocessPreferences(preferences) {
    // Convert preferences to numerical tensor for ML model
    const features = [
      preferences.intensity || 50,
      preferences.season === "spring" ? 1 : 0,
      preferences.season === "summer" ? 1 : 0,
      preferences.season === "fall" ? 1 : 0,
      preferences.season === "winter" ? 1 : 0,
      preferences.occasion === "daily" ? 1 : 0,
      preferences.occasion === "evening" ? 1 : 0,
      preferences.occasion === "special_events" ? 1 : 0,
      // Add more features as needed
    ]

    return tf.tensor2d([features])
  }

  // Real-time learning from user interactions
  async recordInteraction(userId, fragranceId, interactionType, rating = null) {
    const userProfile = this.userProfiles.get(userId) || {
      preferences: [],
      interactions: [],
      purchases: [],
    }

    userProfile.interactions.push({
      fragranceId,
      type: interactionType, // 'view', 'like', 'purchase', 'review'
      rating,
      timestamp: new Date(),
    })

    this.userProfiles.set(userId, userProfile)

    // Update model weights based on interaction (simplified)
    if (this.model && rating) {
      await this.updateModelWeights(userId, fragranceId, rating)
    }
  }

  async updateModelWeights(userId, fragranceId, rating) {
    // In production, this would retrain the model incrementally
    console.log(`Updating model based on user ${userId} rating ${rating} for fragrance ${fragranceId}`)
  }
}

module.exports = new AIRecommendationService()
