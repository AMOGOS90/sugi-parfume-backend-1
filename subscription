"use client"

import { useState } from "react"

const Subscription = () => {
  const [selectedPlan, setSelectedPlan] = useState("premium")
  const [billingCycle, setBillingCycle] = useState("monthly")

  const plans = {
    basic: {
      name: "Discovery",
      monthlyPrice: 29,
      yearlyPrice: 290,
      features: [
        "1 fragrance sample per month",
        "Access to fragrance library",
        "Basic scent profiling",
        "Free shipping",
        "Cancel anytime",
      ],
      popular: false,
    },
    premium: {
      name: "Connoisseur",
      monthlyPrice: 49,
      yearlyPrice: 490,
      features: [
        "2 fragrance samples per month",
        "Full-size bottle every 3 months",
        "Advanced AI recommendations",
        "Exclusive limited editions",
        "Priority customer support",
        "Free shipping",
        "Cancel anytime",
      ],
      popular: true,
    },
    luxury: {
      name: "Curator",
      monthlyPrice: 89,
      yearlyPrice: 890,
      features: [
        "3 fragrance samples per month",
        "Full-size bottle every 2 months",
        "Custom fragrance creation credits",
        "Personal fragrance consultant",
        "Exclusive events access",
        "Premium packaging",
        "Free shipping worldwide",
        "Cancel anytime",
      ],
      popular: false,
    },
  }

  const getPrice = (plan) => {
    return billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice
  }

  const getSavings = (plan) => {
    const monthlyCost = plan.monthlyPrice * 12
    const yearlyCost = plan.yearlyPrice
    return monthlyCost - yearlyCost
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Fragrance Subscription</h1>
          <p className="text-xl text-gray-600 mb-8">
            Discover new scents every month with our curated fragrance subscription
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-white rounded-lg p-1 shadow-md">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === "monthly" ? "bg-pink-600 text-white" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === "yearly" ? "bg-pink-600 text-white" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Yearly
              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Save up to $100</span>
            </button>
          </div>
        </div>

        {/* Subscription Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {Object.entries(plans).map(([key, plan]) => (
            <div
              key={key}
              className={`relative bg-white rounded-xl shadow-lg overflow-hidden ${
                plan.popular ? "ring-2 ring-pink-500" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 bg-pink-600 text-white text-center py-2 text-sm font-medium">
                  Most Popular
                </div>
              )}

              <div className={`p-8 ${plan.popular ? "pt-12" : ""}`}>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">${getPrice(plan)}</span>
                  <span className="text-gray-600">/{billingCycle === "monthly" ? "month" : "year"}</span>
                  {billingCycle === "yearly" && (
                    <div className="text-sm text-green-600 font-medium">Save ${getSavings(plan)} per year</div>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg
                        className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => setSelectedPlan(key)}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    selectedPlan === key
                      ? "bg-pink-600 text-white"
                      : plan.popular
                        ? "bg-pink-600 text-white hover:bg-pink-700"
                        : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                  }`}
                >
                  {selectedPlan === key ? "Selected" : "Choose Plan"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📝</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">1. Take Quiz</h3>
              <p className="text-gray-600 text-sm">
                Complete our scent profile quiz to help us understand your preferences
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">2. AI Curation</h3>
              <p className="text-gray-600 text-sm">
                Our AI selects personalized fragrances based on your unique profile
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📦</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">3. Receive Box</h3>
              <p className="text-gray-600 text-sm">Get your curated selection delivered to your door every month</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💝</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">4. Discover</h3>
              <p className="text-gray-600 text-sm">Explore new scents and build your personal fragrance collection</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <button className="bg-pink-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-pink-700 transition-colors">
            Start Your Fragrance Journey - ${getPrice(plans[selectedPlan])}/
            {billingCycle === "monthly" ? "month" : "year"}
          </button>
          <p className="text-gray-600 mt-4 text-sm">Free shipping • Cancel anytime • 30-day money-back guarantee</p>
        </div>
      </div>
    </div>
  )
}

export default Subscription
