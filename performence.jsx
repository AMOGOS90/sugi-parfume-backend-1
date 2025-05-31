#!/usr/bin/env node

/**
 * Sugi Parfume Performance Testing Script
 *
 * This script runs performance tests against the Sugi Parfume API.
 */

const axios = require("axios")
const { performance } = require("perf_hooks")
const fs = require("fs")
const path = require("path")

// Configuration
const config = {
  apiUrl: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  concurrentUsers: 50,
  requestsPerUser: 10,
  endpoints: [
    { path: "/health", method: "GET", data: null },
    { path: "/products", method: "GET", data: null },
    { path: "/ai/trending", method: "GET", data: null },
  ],
  reportFile: path.join(__dirname, "../logs/performance-report.json"),
}

// Ensure logs directory exists
const logsDir = path.join(__dirname, "../logs")
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

/**
 * Log a message to the console
 */
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`)
}

/**
 * Make a request to an endpoint
 */
async function makeRequest(endpoint) {
  const startTime = performance.now()
  let success = false
  let statusCode = 0
  let errorMessage = null

  try {
    const response = await axios({
      method: endpoint.method,
      url: `${config.apiUrl}${endpoint.path}`,
      data: endpoint.data,
      timeout: 10000,
    })

    success = true
    statusCode = response.status
  } catch (error) {
    success = false
    statusCode = error.response?.status || 0
    errorMessage = error.message
  }

  const endTime = performance.now()
  const duration = endTime - startTime

  return {
    endpoint: endpoint.path,
    method: endpoint.method,
    success,
    statusCode,
    duration,
    errorMessage,
  }
}

/**
 * Simulate a user session
 */
async function simulateUser(userId) {
  const results = []

  log(`User ${userId}: Starting session`)

  for (let i = 0; i < config.requestsPerUser; i++) {
    // Randomly select an endpoint
    const endpoint = config.endpoints[Math.floor(Math.random() * config.endpoints.length)]

    const result = await makeRequest(endpoint)
    results.push(result)

    // Add some randomness to the timing
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 500))
  }

  log(`User ${userId}: Completed session`)
  return results
}

/**
 * Run the performance test
 */
async function runPerformanceTest() {
  log(`Starting performance test with ${config.concurrentUsers} concurrent users`)
  log(`Each user will make ${config.requestsPerUser} requests`)

  const startTime = performance.now()

  const userPromises = []
  for (let i = 0; i < config.concurrentUsers; i++) {
    userPromises.push(simulateUser(i + 1))
  }

  const userResults = await Promise.all(userPromises)
  const allResults = userResults.flat()

  const endTime = performance.now()
  const totalDuration = endTime - startTime

  // Calculate statistics
  const totalRequests = allResults.length
  const successfulRequests = allResults.filter((r) => r.success).length
  const failedRequests = totalRequests - successfulRequests
  const successRate = (successfulRequests / totalRequests) * 100

  const durations = allResults.map((r) => r.duration)
  const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length
  const minDuration = Math.min(...durations)
  const maxDuration = Math.max(...durations)

  // Calculate percentiles
  durations.sort((a, b) => a - b)
  const p50 = durations[Math.floor(durations.length * 0.5)]
  const p90 = durations[Math.floor(durations.length * 0.9)]
  const p95 = durations[Math.floor(durations.length * 0.95)]
  const p99 = durations[Math.floor(durations.length * 0.99)]

  // Group by endpoint
  const endpointStats = {}
  for (const result of allResults) {
    const key = `${result.method} ${result.endpoint}`
    if (!endpointStats[key]) {
      endpointStats[key] = {
        count: 0,
        successful: 0,
        failed: 0,
        durations: [],
      }
    }

    endpointStats[key].count++
    if (result.success) {
      endpointStats[key].successful++
    } else {
      endpointStats[key].failed++
    }
    endpointStats[key].durations.push(result.duration)
  }

  // Calculate endpoint statistics
  for (const key in endpointStats) {
    const stats = endpointStats[key]
    const durations = stats.durations

    stats.avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length
    stats.minDuration = Math.min(...durations)
    stats.maxDuration = Math.max(...durations)

    durations.sort((a, b) => a - b)
    stats.p50 = durations[Math.floor(durations.length * 0.5)]
    stats.p90 = durations[Math.floor(durations.length * 0.9)]
    stats.p95 = durations[Math.floor(durations.length * 0.95)]

    delete stats.durations
  }

  // Create report
  const report = {
    timestamp: new Date().toISOString(),
    configuration: {
      concurrentUsers: config.concurrentUsers,
      requestsPerUser: config.requestsPerUser,
      totalRequests,
    },
    results: {
      totalDuration,
      successfulRequests,
      failedRequests,
      successRate,
      avgDuration,
      minDuration,
      maxDuration,
      p50,
      p90,
      p95,
      p99,
    },
    endpointStats,
  }

  // Save report
  fs.writeFileSync(config.reportFile, JSON.stringify(report, null, 2))

  // Print summary
  log("Performance test completed")
  log(`Total duration: ${Math.round(totalDuration)}ms`)
  log(`Total requests: ${totalRequests}`)
  log(`Successful requests: ${successfulRequests} (${successRate.toFixed(2)}%)`)
  log(`Failed requests: ${failedRequests}`)
  log(`Average response time: ${Math.round(avgDuration)}ms`)
  log(`Min response time: ${Math.round(minDuration)}ms`)
  log(`Max response time: ${Math.round(maxDuration)}ms`)
  log(`P50 response time: ${Math.round(p50)}ms`)
  log(`P90 response time: ${Math.round(p90)}ms`)
  log(`P95 response time: ${Math.round(p95)}ms`)
  log(`P99 response time: ${Math.round(p99)}ms`)
  log(`Report saved to: ${config.reportFile}`)
}

// Run the performance test
runPerformanceTest().catch((error) => {
  log(`Error: ${error.message}`)
  process.exit(1)
})
