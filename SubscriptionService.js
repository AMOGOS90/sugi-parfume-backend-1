const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)
const cron = require("node-cron")
const emailService = require("./EmailService")

class SubscriptionService {
  constructor() {
    this.subscriptions = new Map()
    this.setupCronJobs()
    this.initializeStripe()
  }

  initializeStripe() {
    this.stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  }

  async createSubscription(userId, planId, paymentMethodId, billingCycle = "monthly") {
    try {
      // Create customer in Stripe
      const customer = await stripe.customers.create({
        metadata: { userId: userId.toString() },
      })

      // Attach payment method
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customer.id,
      })

      // Set as default payment method
      await stripe.customers.update(customer.id, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      })

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [
          {
            price: this.getPriceId(planId, billingCycle),
          },
        ],
        payment_behavior: "default_incomplete",
        expand: ["latest_invoice.payment_intent"],
      })

      // Store subscription data
      const subscriptionData = {
        userId,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: customer.id,
        planId,
        billingCycle,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        createdAt: new Date(),
        preferences: {},
        shipments: [],
        paused: false,
      }

      this.subscriptions.set(userId, subscriptionData)

      // Schedule first shipment
      await this.scheduleNextShipment(userId)

      return {
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret,
        subscription: subscriptionData,
      }
    } catch (error) {
      console.error("Error creating subscription:", error)
      throw new Error("Failed to create subscription")
    }
  }

  async updateSubscription(userId, updates) {
    const subscription = this.subscriptions.get(userId)
    if (!subscription) {
      throw new Error("Subscription not found")
    }

    try {
      // Update Stripe subscription if needed
      if (updates.planId || updates.billingCycle) {
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          items: [
            {
              id: subscription.stripeSubscriptionId,
              price: this.getPriceId(
                updates.planId || subscription.planId,
                updates.billingCycle || subscription.billingCycle,
              ),
            },
          ],
          proration_behavior: "create_prorations",
        })
      }

      // Update local data
      Object.assign(subscription, updates, { updatedAt: new Date() })
      this.subscriptions.set(userId, subscription)

      return subscription
    } catch (error) {
      console.error("Error updating subscription:", error)
      throw new Error("Failed to update subscription")
    }
  }

  async pauseSubscription(userId, pauseUntil) {
    const subscription = this.subscriptions.get(userId)
    if (!subscription) {
      throw new Error("Subscription not found")
    }

    try {
      // Pause in Stripe
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        pause_collection: {
          behavior: "void",
          resumes_at: Math.floor(pauseUntil.getTime() / 1000),
        },
      })

      subscription.paused = true
      subscription.pausedUntil = pauseUntil
      this.subscriptions.set(userId, subscription)

      await emailService.sendSubscriptionPausedEmail(userId, pauseUntil)

      return subscription
    } catch (error) {
      console.error("Error pausing subscription:", error)
      throw new Error("Failed to pause subscription")
    }
  }

  async cancelSubscription(userId, reason = "") {
    const subscription = this.subscriptions.get(userId)
    if (!subscription) {
      throw new Error("Subscription not found")
    }

    try {
      // Cancel in Stripe
      await stripe.subscriptions.cancel(subscription.stripeSubscriptionId)

      subscription.status = "canceled"
      subscription.canceledAt = new Date()
      subscription.cancelReason = reason
      this.subscriptions.set(userId, subscription)

      await emailService.sendSubscriptionCanceledEmail(userId, reason)

      return subscription
    } catch (error) {
      console.error("Error canceling subscription:", error)
      throw new Error("Failed to cancel subscription")
    }
  }

  async processShipment(userId) {
    const subscription = this.subscriptions.get(userId)
    if (!subscription || subscription.status !== "active" || subscription.paused) {
      return null
    }

    try {
      // Generate personalized fragrance selection
      const fragranceSelection = await this.generateFragranceSelection(userId, subscription)

      // Create shipment record
      const shipment = {
        id: `SHIP_${Date.now()}_${userId}`,
        userId,
        subscriptionId: subscription.stripeSubscriptionId,
        fragrances: fragranceSelection,
        shippedAt: new Date(),
        trackingNumber: this.generateTrackingNumber(),
        status: "shipped",
        estimatedDelivery: this.calculateDeliveryDate(),
      }

      subscription.shipments.push(shipment)
      this.subscriptions.set(userId, subscription)

      // Send shipping notification
      await emailService.sendShipmentNotification(userId, shipment)

      // Schedule next shipment
      await this.scheduleNextShipment(userId)

      return shipment
    } catch (error) {
      console.error("Error processing shipment:", error)
      throw new Error("Failed to process shipment")
    }
  }

  async generateFragranceSelection(userId, subscription) {
    const aiService = require("./AIRecommendationService")

    // Get user's fragrance history
    const previousFragrances = subscription.shipments.flatMap((s) => s.fragrances.map((f) => f.id))

    // Get user preferences
    const userPreferences = subscription.preferences || {}

    // Generate recommendations excluding previously sent fragrances
    const recommendations = await aiService.generateRecommendations(userPreferences, userId, 10)
    const newRecommendations = recommendations.filter((r) => !previousFragrances.includes(r.id))

    // Select fragrances based on plan
    const planLimits = {
      basic: { samples: 1, fullSize: 0 },
      premium: { samples: 2, fullSize: 0.33 }, // Full size every 3 months
      luxury: { samples: 3, fullSize: 0.5 }, // Full size every 2 months
    }

    const limits = planLimits[subscription.planId] || planLimits.basic
    const selection = []

    // Add samples
    for (let i = 0; i < limits.samples && i < newRecommendations.length; i++) {
      selection.push({
        ...newRecommendations[i],
        size: "5ml",
        type: "sample",
      })
    }

    // Add full size if applicable
    if (Math.random() < limits.fullSize && newRecommendations.length > limits.samples) {
      selection.push({
        ...newRecommendations[limits.samples],
        size: "50ml",
        type: "full_size",
      })
    }

    return selection
  }

  setupCronJobs() {
    // Process monthly shipments (1st of every month at 9 AM)
    cron.schedule("0 9 1 * *", async () => {
      console.log("Processing monthly shipments...")
      await this.processMonthlyShipments()
    })

    // Send renewal reminders (3 days before renewal)
    cron.schedule("0 9 * * *", async () => {
      await this.sendRenewalReminders()
    })

    // Process failed payments
    cron.schedule("0 10 * * *", async () => {
      await this.processFailedPayments()
    })
  }

  async processMonthlyShipments() {
    for (const [userId, subscription] of this.subscriptions) {
      if (subscription.status === "active" && !subscription.paused) {
        try {
          await this.processShipment(userId)
        } catch (error) {
          console.error(`Failed to process shipment for user ${userId}:`, error)
        }
      }
    }
  }

  async sendRenewalReminders() {
    const threeDaysFromNow = new Date()
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)

    for (const [userId, subscription] of this.subscriptions) {
      if (subscription.status === "active" && subscription.currentPeriodEnd <= threeDaysFromNow) {
        await emailService.sendRenewalReminder(userId, subscription)
      }
    }
  }

  async processFailedPayments() {
    // Handle failed payment retries and notifications
    for (const [userId, subscription] of this.subscriptions) {
      if (subscription.status === "past_due") {
        await this.retryFailedPayment(userId)
      }
    }
  }

  async retryFailedPayment(userId) {
    const subscription = this.subscriptions.get(userId)
    try {
      const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId)

      if (stripeSubscription.latest_invoice) {
        await stripe.invoices.pay(stripeSubscription.latest_invoice)
        subscription.status = "active"
        this.subscriptions.set(userId, subscription)

        await emailService.sendPaymentSuccessEmail(userId)
      }
    } catch (error) {
      console.error(`Failed to retry payment for user ${userId}:`, error)
      await emailService.sendPaymentFailedEmail(userId)
    }
  }

  async scheduleNextShipment(userId) {
    const subscription = this.subscriptions.get(userId)
    if (!subscription) return

    const nextShipmentDate = new Date()
    nextShipmentDate.setMonth(nextShipmentDate.getMonth() + 1)
    nextShipmentDate.setDate(1) // First of next month

    subscription.nextShipmentDate = nextShipmentDate
    this.subscriptions.set(userId, subscription)
  }

  getPriceId(planId, billingCycle) {
    const priceIds = {
      basic: {
        monthly: "price_basic_monthly",
        yearly: "price_basic_yearly",
      },
      premium: {
        monthly: "price_premium_monthly",
        yearly: "price_premium_yearly",
      },
      luxury: {
        monthly: "price_luxury_monthly",
        yearly: "price_luxury_yearly",
      },
    }

    return priceIds[planId]?.[billingCycle] || priceIds.basic.monthly
  }

  generateTrackingNumber() {
    return `SUGI${Date.now().toString().slice(-8)}${Math.random().toString(36).substr(2, 4).toUpperCase()}`
  }

  calculateDeliveryDate() {
    const deliveryDate = new Date()
    deliveryDate.setDate(deliveryDate.getDate() + 3) // 3 days for delivery
    return deliveryDate
  }

  async handleStripeWebhook(event) {
    try {
      switch (event.type) {
        case "invoice.payment_succeeded":
          await this.handlePaymentSucceeded(event.data.object)
          break
        case "invoice.payment_failed":
          await this.handlePaymentFailed(event.data.object)
          break
        case "customer.subscription.updated":
          await this.handleSubscriptionUpdated(event.data.object)
          break
        case "customer.subscription.deleted":
          await this.handleSubscriptionDeleted(event.data.object)
          break
        default:
          console.log(`Unhandled event type: ${event.type}`)
      }
    } catch (error) {
      console.error("Error handling webhook:", error)
    }
  }

  async handlePaymentSucceeded(invoice) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription)
    const userId = subscription.metadata.userId

    if (userId) {
      const localSubscription = this.subscriptions.get(Number.parseInt(userId))
      if (localSubscription) {
        localSubscription.status = "active"
        localSubscription.currentPeriodStart = new Date(subscription.current_period_start * 1000)
        localSubscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000)
        this.subscriptions.set(Number.parseInt(userId), localSubscription)
      }
    }
  }

  async handlePaymentFailed(invoice) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription)
    const userId = subscription.metadata.userId

    if (userId) {
      const localSubscription = this.subscriptions.get(Number.parseInt(userId))
      if (localSubscription) {
        localSubscription.status = "past_due"
        this.subscriptions.set(Number.parseInt(userId), localSubscription)

        await emailService.sendPaymentFailedEmail(Number.parseInt(userId))
      }
    }
  }

  async handleSubscriptionUpdated(subscription) {
    const userId = subscription.metadata.userId
    if (userId) {
      const localSubscription = this.subscriptions.get(Number.parseInt(userId))
      if (localSubscription) {
        localSubscription.status = subscription.status
        this.subscriptions.set(Number.parseInt(userId), localSubscription)
      }
    }
  }

  async handleSubscriptionDeleted(subscription) {
    const userId = subscription.metadata.userId
    if (userId) {
      const localSubscription = this.subscriptions.get(Number.parseInt(userId))
      if (localSubscription) {
        localSubscription.status = "canceled"
        localSubscription.canceledAt = new Date()
        this.subscriptions.set(Number.parseInt(userId), localSubscription)
      }
    }
  }

  // Analytics methods
  getSubscriptionAnalytics() {
    const analytics = {
      totalSubscriptions: this.subscriptions.size,
      activeSubscriptions: 0,
      pausedSubscriptions: 0,
      canceledSubscriptions: 0,
      revenueByPlan: { basic: 0, premium: 0, luxury: 0 },
      churnRate: 0,
      averageLifetimeValue: 0,
    }

    for (const [userId, subscription] of this.subscriptions) {
      switch (subscription.status) {
        case "active":
          analytics.activeSubscriptions++
          break
        case "canceled":
          analytics.canceledSubscriptions++
          break
      }

      if (subscription.paused) {
        analytics.pausedSubscriptions++
      }

      // Calculate revenue (simplified)
      const planPrices = { basic: 29, premium: 49, luxury: 89 }
      analytics.revenueByPlan[subscription.planId] += planPrices[subscription.planId] || 0
    }

    analytics.churnRate = (analytics.canceledSubscriptions / analytics.totalSubscriptions) * 100

    return analytics
  }
}

module.exports = new SubscriptionService()
