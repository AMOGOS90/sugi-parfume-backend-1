const nodemailer = require("nodemailer")
const handlebars = require("handlebars")
const fs = require("fs").promises

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    this.templates = new Map()
    this.loadTemplates()
  }

  async loadTemplates() {
    try {
      const templates = [
        "welcome",
        "shipment-notification",
        "subscription-paused",
        "subscription-canceled",
        "payment-failed",
        "payment-success",
        "renewal-reminder",
        "recommendation-update",
      ]

      for (const templateName of templates) {
        const templateContent = await fs.readFile(`./templates/${templateName}.hbs`, "utf8")
        this.templates.set(templateName, handlebars.compile(templateContent))
      }
    } catch (error) {
      console.error("Error loading email templates:", error)
    }
  }

  async sendWelcomeEmail(userId, userEmail, userName) {
    const template = this.templates.get("welcome")
    if (!template) return

    const html = template({
      userName,
      loginUrl: `${process.env.FRONTEND_URL}/login`,
      supportEmail: process.env.SUPPORT_EMAIL,
    })

    await this.sendEmail({
      to: userEmail,
      subject: "Welcome to Sugi Parfume!",
      html,
    })
  }

  async sendShipmentNotification(userId, shipment) {
    const user = await this.getUserById(userId)
    const template = this.templates.get("shipment-notification")
    if (!template || !user) return

    const html = template({
      userName: user.name,
      trackingNumber: shipment.trackingNumber,
      fragrances: shipment.fragrances,
      estimatedDelivery: shipment.estimatedDelivery.toLocaleDateString(),
      trackingUrl: `${process.env.FRONTEND_URL}/track/${shipment.trackingNumber}`,
    })

    await this.sendEmail({
      to: user.email,
      subject: "Your Sugi Parfume Box is on the way! 📦",
      html,
    })
  }

  async sendSubscriptionPausedEmail(userId, pauseUntil) {
    const user = await this.getUserById(userId)
    const template = this.templates.get("subscription-paused")
    if (!template || !user) return

    const html = template({
      userName: user.name,
      resumeDate: pauseUntil.toLocaleDateString(),
      manageUrl: `${process.env.FRONTEND_URL}/subscription/manage`,
    })

    await this.sendEmail({
      to: user.email,
      subject: "Your Sugi Parfume subscription is paused",
      html,
    })
  }

  async sendSubscriptionCanceledEmail(userId, reason) {
    const user = await this.getUserById(userId)
    const template = this.templates.get("subscription-canceled")
    if (!template || !user) return

    const html = template({
      userName: user.name,
      reason,
      reactivateUrl: `${process.env.FRONTEND_URL}/subscription/reactivate`,
      feedbackUrl: `${process.env.FRONTEND_URL}/feedback`,
    })

    await this.sendEmail({
      to: user.email,
      subject: "Sorry to see you go - Sugi Parfume",
      html,
    })
  }

  async sendPaymentFailedEmail(userId) {
    const user = await this.getUserById(userId)
    const template = this.templates.get("payment-failed")
    if (!template || !user) return

    const html = template({
      userName: user.name,
      updatePaymentUrl: `${process.env.FRONTEND_URL}/subscription/payment`,
      supportEmail: process.env.SUPPORT_EMAIL,
    })

    await this.sendEmail({
      to: user.email,
      subject: "Payment Issue - Action Required",
      html,
    })
  }

  async sendPaymentSuccessEmail(userId) {
    const user = await this.getUserById(userId)
    const template = this.templates.get("payment-success")
    if (!template || !user) return

    const html = template({
      userName: user.name,
      accountUrl: `${process.env.FRONTEND_URL}/account`,
    })

    await this.sendEmail({
      to: user.email,
      subject: "Payment Successful - Thank you!",
      html,
    })
  }

  async sendRenewalReminder(userId, subscription) {
    const user = await this.getUserById(userId)
    const template = this.templates.get("renewal-reminder")
    if (!template || !user) return

    const html = template({
      userName: user.name,
      renewalDate: subscription.currentPeriodEnd.toLocaleDateString(),
      planName: subscription.planId,
      manageUrl: `${process.env.FRONTEND_URL}/subscription/manage`,
    })

    await this.sendEmail({
      to: user.email,
      subject: "Your subscription renews soon",
      html,
    })
  }

  async sendRecommendationUpdate(userId, recommendations) {
    const user = await this.getUserById(userId)
    const template = this.templates.get("recommendation-update")
    if (!template || !user) return

    const html = template({
      userName: user.name,
      recommendations: recommendations.slice(0, 3), // Top 3 recommendations
      shopUrl: `${process.env.FRONTEND_URL}/recommendations`,
    })

    await this.sendEmail({
      to: user.email,
      subject: "New fragrance recommendations just for you! ✨",
      html,
    })
  }

  async sendEmail({ to, subject, html, attachments = [] }) {
    try {
      const mailOptions = {
        from: `"Sugi Parfume" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
        attachments,
      }

      const result = await this.transporter.sendMail(mailOptions)
      console.log("Email sent successfully:", result.messageId)
      return result
    } catch (error) {
      console.error("Error sending email:", error)
      throw error
    }
  }

  async getUserById(userId) {
    // This would typically query your user database
    // For now, returning mock data
    return {
      id: userId,
      name: "User Name",
      email: "user@example.com",
    }
  }

  // Bulk email functionality
  async sendBulkEmail(userIds, templateName, templateData) {
    const template = this.templates.get(templateName)
    if (!template) {
      throw new Error(`Template ${templateName} not found`)
    }

    const results = []
    for (const userId of userIds) {
      try {
        const user = await this.getUserById(userId)
        if (user) {
          const html = template({ ...templateData, userName: user.name })
          const result = await this.sendEmail({
            to: user.email,
            subject: templateData.subject,
            html,
          })
          results.push({ userId, success: true, messageId: result.messageId })
        }
      } catch (error) {
        results.push({ userId, success: false, error: error.message })
      }
    }

    return results
  }

  // Email analytics
  getEmailAnalytics() {
    // In production, this would track email opens, clicks, etc.
    return {
      totalSent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      unsubscribed: 0,
    }
  }
}

module.exports = new EmailService()
