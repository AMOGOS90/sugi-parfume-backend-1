const express = require("express")
const router = express.Router()
const subscriptionService = require("../services/SubscriptionService")
const authenticateToken = require("../middleware/auth")

// Create new subscription
router.post("/create", authenticateToken, async (req, res) => {
  try {
    const { planId, paymentMethodId, billingCycle } = req.body
    const userId = req.user.userId

    const result = await subscriptionService.createSubscription(userId, planId, paymentMethodId, billingCycle)

    res.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error("Error creating subscription:", error)
    res.status(500).json({
      success: false,
      message: "Failed to create subscription",
      error: error.message,
    })
  }
})

// Get user's subscription
router.get("/current", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId
    const subscription = subscriptionService.subscriptions.get(userId)

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "No active subscription found",
      })
    }

    res.json({
      success: true,
      subscription,
    })
  } catch (error) {
    console.error("Error fetching subscription:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch subscription",
      error: error.message,
    })
  }
})

// Update subscription
router.put("/update", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId
    const updates = req.body

    const subscription = await subscriptionService.updateSubscription(userId, updates)

    res.json({
      success: true,
      subscription,
    })
  } catch (error) {
    console.error("Error updating subscription:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update subscription",
      error: error.message,
    })
  }
})

// Pause subscription
router.post("/pause", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId
    const { pauseUntil } = req.body

    const subscription = await subscriptionService.pauseSubscription(userId, new Date(pauseUntil))

    res.json({
      success: true,
      subscription,
    })
  } catch (error) {
    console.error("Error pausing subscription:", error)
    res.status(500).json({
      success: false,
      message: "Failed to pause subscription",
      error: error.message,
    })
  }
})

// Cancel subscription
router.post("/cancel", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId
    const { reason } = req.body

    const subscription = await subscriptionService.cancelSubscription(userId, reason)

    res.json({
      success: true,
      subscription,
    })
  } catch (error) {
    console.error("Error canceling subscription:", error)
    res.status(500).json({
      success: false,
      message: "Failed to cancel subscription",
      error: error.message,
    })
  }
})

// Get shipment history
router.get("/shipments", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId
    const subscription = subscriptionService.subscriptions.get(userId)

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "No subscription found",
      })
    }

    res.json({
      success: true,
      shipments: subscription.shipments || [],
    })
  } catch (error) {
    console.error("Error fetching shipments:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch shipments",
      error: error.message,
    })
  }
})

// Track shipment
router.get("/track/:trackingNumber", async (req, res) => {
  try {
    const { trackingNumber } = req.params

    // Find shipment by tracking number
    let foundShipment = null
    for (const [userId, subscription] of subscriptionService.subscriptions) {
      const shipment = subscription.shipments?.find((s) => s.trackingNumber === trackingNumber)
      if (shipment) {
        foundShipment = shipment
        break
      }
    }

    if (!foundShipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found",
      })
    }

    res.json({
      success: true,
      shipment: foundShipment,
    })
  } catch (error) {
    console.error("Error tracking shipment:", error)
    res.status(500).json({
      success: false,
      message: "Failed to track shipment",
      error: error.message,
    })
  }
})

// Stripe webhook endpoint
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  try {
    const sig = req.headers["stripe-signature"]
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)

    const event = stripe.webhooks.constructEvent(req.body, sig, subscriptionService.stripeWebhookSecret)

    await subscriptionService.handleStripeWebhook(event)

    res.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    res.status(400).json({
      success: false,
      message: "Webhook error",
      error: error.message,
    })
  }
})

// Admin: Get subscription analytics
router.get("/analytics", authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      })
    }

    const analytics = subscriptionService.getSubscriptionAnalytics()

    res.json({
      success: true,
      analytics,
    })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch analytics",
      error: error.message,
    })
  }
})

module.exports = router
