import axios from "axios"

class ApiService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || "http://localhost:5000/api"
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
    })

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("token")
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error),
    )

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem("token")
          localStorage.removeItem("user")
          window.location.href = "/login"
        }
        return Promise.reject(error)
      },
    )
  }

  // AI Recommendations
  async getRecommendations(preferences) {
    const response = await this.client.post("/ai/recommendations", { preferences })
    return response.data
  }

  async recordInteraction(fragranceId, interactionType, rating = null) {
    const response = await this.client.post("/ai/interaction", {
      fragranceId,
      interactionType,
      rating,
    })
    return response.data
  }

  async getUserProfile() {
    const response = await this.client.get("/ai/profile")
    return response.data
  }

  async updatePreferences(preferences) {
    const response = await this.client.put("/ai/preferences", { preferences })
    return response.data
  }

  async getTrendingFragrances() {
    const response = await this.client.get("/ai/trending")
    return response.data
  }

  // Subscription Management
  async createSubscription(planId, paymentMethodId, billingCycle) {
    const response = await this.client.post("/subscription/create", {
      planId,
      paymentMethodId,
      billingCycle,
    })
    return response.data
  }

  async getCurrentSubscription() {
    const response = await this.client.get("/subscription/current")
    return response.data
  }

  async updateSubscription(updates) {
    const response = await this.client.put("/subscription/update", updates)
    return response.data
  }

  async pauseSubscription(pauseUntil) {
    const response = await this.client.post("/subscription/pause", { pauseUntil })
    return response.data
  }

  async cancelSubscription(reason) {
    const response = await this.client.post("/subscription/cancel", { reason })
    return response.data
  }

  async getShipmentHistory() {
    const response = await this.client.get("/subscription/shipments")
    return response.data
  }

  async trackShipment(trackingNumber) {
    const response = await this.client.get(`/subscription/track/${trackingNumber}`)
    return response.data
  }

  // Custom Fragrance Builder
  async createCustomFragrance(fragranceData) {
    const response = await this.client.post("/products/custom", fragranceData)
    return response.data
  }

  async getFragranceIngredients() {
    const response = await this.client.get("/products/ingredients")
    return response.data
  }

  async calculateCustomPrice(ingredients, intensity) {
    const response = await this.client.post("/products/calculate-price", {
      ingredients,
      intensity,
    })
    return response.data
  }

  // Analytics (Admin)
  async getSubscriptionAnalytics() {
    const response = await this.client.get("/subscription/analytics")
    return response.data
  }

  async getRecommendationAnalytics() {
    const response = await this.client.get("/ai/analytics")
    return response.data
  }

  async getUserAnalytics() {
    const response = await this.client.get("/users/analytics")
    return response.data
  }

  // Real-time features
  setupWebSocket() {
    const wsUrl = process.env.REACT_APP_WS_URL || "ws://localhost:5000"
    this.ws = new WebSocket(wsUrl)

    this.ws.onopen = () => {
      console.log("WebSocket connected")
    }

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      this.handleWebSocketMessage(data)
    }

    this.ws.onclose = () => {
      console.log("WebSocket disconnected")
      // Attempt to reconnect after 5 seconds
      setTimeout(() => this.setupWebSocket(), 5000)
    }
  }

  handleWebSocketMessage(data) {
    switch (data.type) {
      case "RECOMMENDATION_UPDATE":
        // Trigger recommendation refresh
        window.dispatchEvent(new CustomEvent("recommendationUpdate", { detail: data }))
        break
      case "SHIPMENT_UPDATE":
        // Trigger shipment status update
        window.dispatchEvent(new CustomEvent("shipmentUpdate", { detail: data }))
        break
      case "SUBSCRIPTION_UPDATE":
        // Trigger subscription status update
        window.dispatchEvent(new CustomEvent("subscriptionUpdate", { detail: data }))
        break
      default:
        console.log("Unknown WebSocket message type:", data.type)
    }
  }

  sendWebSocketMessage(type, data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }))
    }
  }

  // Utility methods
  async uploadImage(file) {
    const formData = new FormData()
    formData.append("image", file)

    const response = await this.client.post("/upload/image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    return response.data
  }

  async exportUserData() {
    const response = await this.client.get("/users/export", {
      responseType: "blob",
    })
    return response.data
  }

  async deleteUserAccount() {
    const response = await this.client.delete("/users/account")
    return response.data
  }
}

export default new ApiService()
