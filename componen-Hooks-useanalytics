"use client"

import { useEffect } from "react"
import apiService from "../services/api"

export const useAnalytics = () => {
  useEffect(() => {
    // Track page views
    const trackPageView = () => {
      const userId = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")).id : null
      apiService.trackPageView(window.location.pathname, userId)
    }

    // Track initial page view
    trackPageView()

    // Track page changes (for SPA)
    const handlePopState = () => {
      trackPageView()
    }

    window.addEventListener("popstate", handlePopState)

    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [])

  const trackEvent = (eventType, eventData) => {
    const userId = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")).id : null
    apiService.trackEvent(eventType, eventData, userId)
  }

  const trackConversion = (conversionType, value = 0) => {
    const userId = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")).id : null
    apiService.trackConversion(conversionType, value, userId)
  }

  return {
    trackEvent,
    trackConversion,
  }
}
