"use client"

import { useState } from "react"

const Recommendations = () => {
  const [userPreferences, setUserPreferences] = useState({
    occasion: "",
    season: "",
    intensity: 50,
    priceRange: "",
    favoriteNotes: [],
  })
  const [recommendations, setRecommendations] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const occasions = ["Daily Wear", "Evening", "Special Events", "Work", "Date Night"]
  const seasons = ["Spring", "Summer", "Fall", "Winter"]
  const priceRanges = ["Under $100", "$100-200", "$200-300", "Above $300"]
  const availableNotes = ["Citrus", "Floral", "Woody", "Fresh", "Spicy", "Sweet", "Musky", "Earthy"]

  // Mock AI recommendation algorithm
  const generateRecommendations = () => {
    setIsLoading(true)

    // Simulate API call delay
    setTimeout(() => {
      const mockRecommendations = [
        {
          id: 1,
          name: "Sugi Classic",
          description: "Perfect for daily wear with fresh cedar notes",
          price: 180,
          match: 95,
          image: "/placeholder.svg?height=200&width=200",
          notes: ["Japanese Cedar", "Bergamot", "Sandalwood"],
          reason: "Matches your preference for woody and fresh scents",
        },
        {
          id: 2,
          name: "Evening Elegance",
          description: "Sophisticated blend for special occasions",
          price: 240,
          match: 88,
          image: "/placeholder.svg?height=200&width=200",
          notes: ["Rose", "Amber", "Vanilla"],
          reason: "Perfect intensity level for evening events",
        },
        {
          id: 3,
          name: "Fresh Breeze",
          description: "Light and airy for summer days",
          price: 120,
          match: 82,
          image: "/placeholder.svg?height=200&width=200",
          notes: ["Lemon", "Lavender", "White Musk"],
          reason: "Ideal for your selected season and occasion",
        },
        {
          id: 4,
          name: "Custom Creation",
          description: "Build your own unique fragrance",
          price: 200,
          match: 90,
          image: "/placeholder.svg?height=200&width=200",
          notes: ["Your Choice", "Personalized", "Unique"],
          reason: "Tailored exactly to your preferences",
        },
      ]

      setRecommendations(mockRecommendations)
      setIsLoading(false)
    }, 2000)
  }

  const handlePreferenceChange = (key, value) => {
    setUserPreferences((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const toggleNote = (note) => {
    setUserPreferences((prev) => ({
      ...prev,
      favoriteNotes: prev.favoriteNotes.includes(note)
        ? prev.favoriteNotes.filter((n) => n !== note)
        : [...prev.favoriteNotes, note],
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Fragrance Recommendations</h1>
          <p className="text-gray-600">Tell us your preferences and we'll find your perfect scent</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Preferences Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-xl font-semibold mb-6">Your Preferences</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Occasion</label>
                  <select
                    value={userPreferences.occasion}
                    onChange={(e) => handlePreferenceChange("occasion", e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                  >
                    <option value="">Select occasion</option>
                    {occasions.map((occasion) => (
                      <option key={occasion} value={occasion}>
                        {occasion}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Season</label>
                  <select
                    value={userPreferences.season}
                    onChange={(e) => handlePreferenceChange("season", e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                  >
                    <option value="">Select season</option>
                    {seasons.map((season) => (
                      <option key={season} value={season}>
                        {season}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Intensity: {userPreferences.intensity}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={userPreferences.intensity}
                    onChange={(e) => handlePreferenceChange("intensity", Number.parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Light</span>
                    <span>Strong</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                  <select
                    value={userPreferences.priceRange}
                    onChange={(e) => handlePreferenceChange("priceRange", e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                  >
                    <option value="">Select price range</option>
                    {priceRanges.map((range) => (
                      <option key={range} value={range}>
                        {range}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Favorite Notes</label>
                  <div className="grid grid-cols-2 gap-2">
                    {availableNotes.map((note) => (
                      <button
                        key={note}
                        onClick={() => toggleNote(note)}
                        className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                          userPreferences.favoriteNotes.includes(note)
                            ? "bg-pink-100 border-pink-300 text-pink-700"
                            : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {note}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={generateRecommendations}
                  disabled={isLoading}
                  className="w-full bg-pink-600 text-white py-2 px-4 rounded-md hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Analyzing..." : "Get Recommendations"}
                </button>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="lg:col-span-2">
            {isLoading ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Our AI is analyzing your preferences...</p>
              </div>
            ) : recommendations.length > 0 ? (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-900">Recommended for You</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {recommendations.map((product) => (
                    <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                      <img
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-green-600">{product.match}% match</span>
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{product.description}</p>
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">Key Notes:</p>
                          <div className="flex flex-wrap gap-1">
                            {product.notes.map((note) => (
                              <span key={note} className="px-2 py-1 bg-pink-100 text-pink-700 text-xs rounded-full">
                                {note}
                              </span>
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-4 italic">"{product.reason}"</p>
                        <div className="flex justify-between items-center">
                          <span className="text-xl font-bold text-gray-900">${product.price}</span>
                          <button className="bg-pink-600 text-white px-4 py-2 rounded-md hover:bg-pink-700 text-sm">
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <div className="text-gray-400 text-6xl mb-4">🌸</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Find Your Perfect Scent?</h3>
                <p className="text-gray-600">
                  Fill out your preferences and let our AI recommend the perfect fragrance for you.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Recommendations
