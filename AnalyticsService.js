class AnalyticsService {
  constructor() {
    this.events = []
    this.userSessions = new Map()
    this.metrics = {
      pageViews: new Map(),
      userActions: new Map(),
      conversionFunnels: new Map(),
      revenueMetrics: {
        daily: new Map(),
        monthly: new Map(),
        yearly: new Map(),
      },
    }
  }

  // Track user events
  trackEvent(userId, eventType, eventData = {}) {
    const event = {
      userId,
      eventType,
      eventData,
      timestamp: new Date(),
      sessionId: this.getOrCreateSession(userId),
    }

    this.events.push(event)
    this.updateMetrics(event)

    // Keep only last 10000 events in memory
    if (this.events.length > 10000) {
      this.events = this.events.slice(-10000)
    }

    return event
  }

  // Track page views
  trackPageView(userId, page, referrer = null) {
    this.trackEvent(userId, "page_view", { page, referrer })

    const pageKey = page
    this.metrics.pageViews.set(pageKey, (this.metrics.pageViews.get(pageKey) || 0) + 1)
  }

  // Track user actions
  trackUserAction(userId, action, details = {}) {
    this.trackEvent(userId, "user_action", { action, ...details })

    const actionKey = action
    this.metrics.userActions.set(actionKey, (this.metrics.userActions.get(actionKey) || 0) + 1)
  }

  // Track conversions
  trackConversion(userId, conversionType, value = 0) {
    this.trackEvent(userId, "conversion", { conversionType, value })

    // Update revenue metrics
    const today = new Date().toISOString().split("T")[0]
    const month = today.substring(0, 7)
    const year = today.substring(0, 4)

    this.metrics.revenueMetrics.daily.set(today, (this.metrics.revenueMetrics.daily.get(today) || 0) + value)
    this.metrics.revenueMetrics.monthly.set(month, (this.metrics.revenueMetrics.monthly.get(month) || 0) + value)
    this.metrics.revenueMetrics.yearly.set(year, (this.metrics.revenueMetrics.yearly.get(year) || 0) + value)
  }

  // Track recommendation interactions
  trackRecommendationInteraction(userId, fragranceId, interactionType, confidence = null) {
    this.trackEvent(userId, "recommendation_interaction", {
      fragranceId,
      interactionType,
      confidence,
    })
  }

  // Track subscription events
  trackSubscriptionEvent(userId, eventType, planId = null, amount = 0) {
    this.trackEvent(userId, "subscription_event", {
      eventType,
      planId,
      amount,
    })

    if (eventType === "created" || eventType === "renewed") {
      this.trackConversion(userId, "subscription", amount)
    }
  }

  // Get or create user session
  getOrCreateSession(userId) {
    const now = new Date()
    const existingSession = this.userSessions.get(userId)

    if (existingSession && now - existingSession.lastActivity < 30 * 60 * 1000) {
      // Session is still active (less than 30 minutes)
      existingSession.lastActivity = now
      return existingSession.sessionId
    }

    // Create new session
    const sessionId = `session_${userId}_${now.getTime()}`
    this.userSessions.set(userId, {
      sessionId,
      startTime: now,
      lastActivity: now,
    })

    return sessionId
  }

  // Update metrics based on events
  updateMetrics(event) {
    // Update conversion funnels
    if (event.eventType === "page_view") {
      this.updateConversionFunnel(event.userId, event.eventData.page)
    }
  }

  // Update conversion funnel tracking
  updateConversionFunnel(userId, page) {
    const funnelSteps = ["home", "recommendations", "product", "cart", "checkout", "success"]
    const stepIndex = funnelSteps.indexOf(page)

    if (stepIndex !== -1) {
      const funnelKey = `step_${stepIndex}_${funnelSteps[stepIndex]}`
      this.metrics.conversionFunnels.set(funnelKey, (this.metrics.conversionFunnels.get(funnelKey) || 0) + 1)
    }
  }

  // Get analytics dashboard data
  getDashboardData(timeRange = "7d") {
    const now = new Date()
    const startDate = new Date(now)

    switch (timeRange) {
      case "24h":
        startDate.setDate(startDate.getDate() - 1)
        break
      case "7d":
        startDate.setDate(startDate.getDate() - 7)
        break
      case "30d":
        startDate.setDate(startDate.getDate() - 30)
        break
      case "90d":
        startDate.setDate(startDate.getDate() - 90)
        break
      default:
        startDate.setDate(startDate.getDate() - 7)
    }

    const filteredEvents = this.events.filter((event) => event.timestamp >= startDate)

    return {
      totalEvents: filteredEvents.length,
      uniqueUsers: new Set(filteredEvents.map((e) => e.userId)).size,
      topPages: this.getTopPages(filteredEvents),
      topActions: this.getTopActions(filteredEvents),
      conversionRates: this.getConversionRates(filteredEvents),
      revenueMetrics: this.getRevenueMetrics(timeRange),
      userEngagement: this.getUserEngagement(filteredEvents),
      recommendationMetrics: this.getRecommendationMetrics(filteredEvents),
    }
  }

  getTopPages(events) {
    const pageViews = {}
    events
      .filter((e) => e.eventType === "page_view")
      .forEach((e) => {
        const page = e.eventData.page
        pageViews[page] = (pageViews[page] || 0) + 1
      })

    return Object.entries(pageViews)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([page, views]) => ({ page, views }))
  }

  getTopActions(events) {
    const actions = {}
    events
      .filter((e) => e.eventType === "user_action")
      .forEach((e) => {
        const action = e.eventData.action
        actions[action] = (actions[action] || 0) + 1
      })

    return Object.entries(actions)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([action, count]) => ({ action, count }))
  }

  getConversionRates(events) {
    const funnelSteps = ["home", "recommendations", "product", "cart", "checkout", "success"]
    const stepCounts = {}

    events
      .filter((e) => e.eventType === "page_view")
      .forEach((e) => {
        const page = e.eventData.page
        if (funnelSteps.includes(page)) {
          stepCounts[page] = (stepCounts[page] || 0) + 1
        }
      })

    const conversionRates = []
    for (let i = 0; i < funnelSteps.length - 1; i++) {
      const currentStep = funnelSteps[i]
      const nextStep = funnelSteps[i + 1]
      const currentCount = stepCounts[currentStep] || 0
      const nextCount = stepCounts[nextStep] || 0
      const rate = currentCount > 0 ? (nextCount / currentCount) * 100 : 0

      conversionRates.push({
        from: currentStep,
        to: nextStep,
        rate: Math.round(rate * 100) / 100,
      })
    }

    return conversionRates
  }

  getRevenueMetrics(timeRange) {
    const now = new Date()
    const metrics = { total: 0, growth: 0, breakdown: [] }

    if (timeRange === "30d") {
      // Get last 30 days of daily revenue
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        const dateKey = date.toISOString().split("T")[0]
        const revenue = this.metrics.revenueMetrics.daily.get(dateKey) || 0
        metrics.total += revenue
        metrics.breakdown.push({ date: dateKey, revenue })
      }
    }

    return metrics
  }

  getUserEngagement(events) {
    const userSessions = {}
    const userActions = {}

    events.forEach((event) => {
      const userId = event.userId
      const sessionId = event.sessionId

      // Track sessions
      if (!userSessions[userId]) {
        userSessions[userId] = new Set()
      }
      userSessions[userId].add(sessionId)

      // Track actions per user
      if (event.eventType === "user_action") {
        userActions[userId] = (userActions[userId] || 0) + 1
      }
    })

    const totalUsers = Object.keys(userSessions).length
    const avgSessionsPerUser =
      totalUsers > 0 ? Object.values(userSessions).reduce((sum, sessions) => sum + sessions.size, 0) / totalUsers : 0
    const avgActionsPerUser =
      totalUsers > 0 ? Object.values(userActions).reduce((sum, actions) => sum + actions, 0) / totalUsers : 0

    return {
      totalUsers,
      avgSessionsPerUser: Math.round(avgSessionsPerUser * 100) / 100,
      avgActionsPerUser: Math.round(avgActionsPerUser * 100) / 100,
    }
  }

  getRecommendationMetrics(events) {
    const recommendationEvents = events.filter((e) => e.eventType === "recommendation_interaction")
    const totalRecommendations = recommendationEvents.length
    const clickedRecommendations = recommendationEvents.filter((e) => e.eventData.interactionType === "click").length
    const purchasedRecommendations = recommendationEvents.filter(
      (e) => e.eventData.interactionType === "purchase",
    ).length

    const clickThroughRate = totalRecommendations > 0 ? (clickedRecommendations / totalRecommendations) * 100 : 0
    const conversionRate = clickedRecommendations > 0 ? (purchasedRecommendations / clickedRecommendations) * 100 : 0

    return {
      totalRecommendations,
      clickThroughRate: Math.round(clickThroughRate * 100) / 100,
      conversionRate: Math.round(conversionRate * 100) / 100,
    }
  }

  // Export analytics data
  exportData(format = "json", timeRange = "30d") {
    const data = this.getDashboardData(timeRange)

    if (format === "csv") {
      return this.convertToCSV(data)
    }

    return JSON.stringify(data, null, 2)
  }

  convertToCSV(data) {
    // Convert analytics data to CSV format
    let csv = "Metric,Value\n"
    csv += `Total Events,${data.totalEvents}\n`
    csv += `Unique Users,${data.uniqueUsers}\n`
    csv += `Revenue Total,${data.revenueMetrics.total}\n`

    return csv
  }
}

module.exports = new AnalyticsService()
