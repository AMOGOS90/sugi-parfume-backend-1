"use client"

import { useState } from "react"

const FragranceBuilder = () => {
  const [selectedNotes, setSelectedNotes] = useState({
    top: [],
    heart: [],
    base: [],
  })
  const [customName, setCustomName] = useState("")
  const [intensity, setIntensity] = useState(50)
  const [currentStep, setCurrentStep] = useState(1)

  const fragranceNotes = {
    top: [
      { id: 1, name: "Bergamot", description: "Citrusy and fresh", price: 15 },
      { id: 2, name: "Lemon", description: "Bright and zesty", price: 12 },
      { id: 3, name: "Pink Pepper", description: "Spicy and warm", price: 18 },
      { id: 4, name: "Yuzu", description: "Japanese citrus", price: 20 },
      { id: 5, name: "Lavender", description: "Floral and calming", price: 16 },
    ],
    heart: [
      { id: 6, name: "Japanese Cedar", description: "Woody and serene", price: 25 },
      { id: 7, name: "Rose", description: "Classic and romantic", price: 30 },
      { id: 8, name: "Jasmine", description: "Exotic and intoxicating", price: 28 },
      { id: 9, name: "Hinoki", description: "Sacred Japanese wood", price: 35 },
      { id: 10, name: "Pine", description: "Fresh forest scent", price: 22 },
    ],
    base: [
      { id: 11, name: "Sandalwood", description: "Creamy and smooth", price: 40 },
      { id: 12, name: "Vetiver", description: "Earthy and grounding", price: 35 },
      { id: 13, name: "Amber", description: "Warm and resinous", price: 45 },
      { id: 14, name: "Musk", description: "Sensual and lasting", price: 50 },
      { id: 15, name: "Vanilla", description: "Sweet and comforting", price: 30 },
    ],
  }

  const toggleNote = (category, note) => {
    setSelectedNotes((prev) => ({
      ...prev,
      [category]: prev[category].find((n) => n.id === note.id)
        ? prev[category].filter((n) => n.id !== note.id)
        : [...prev[category], note],
    }))
  }

  const calculatePrice = () => {
    const basePrice = 120
    const notesPrice = [...selectedNotes.top, ...selectedNotes.heart, ...selectedNotes.base].reduce(
      (sum, note) => sum + note.price,
      0,
    )
    const intensityMultiplier = 1 + (intensity - 50) / 100
    return Math.round((basePrice + notesPrice) * intensityMultiplier)
  }

  const getTotalNotes = () => {
    return selectedNotes.top.length + selectedNotes.heart.length + selectedNotes.base.length
  }

  const renderNoteSelection = (category, title) => (
    <div className="mb-8">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {fragranceNotes[category].map((note) => (
          <div
            key={note.id}
            onClick={() => toggleNote(category, note)}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              selectedNotes[category].find((n) => n.id === note.id)
                ? "border-pink-500 bg-pink-50"
                : "border-gray-200 hover:border-pink-300"
            }`}
          >
            <h4 className="font-medium text-gray-800">{note.name}</h4>
            <p className="text-sm text-gray-600 mt-1">{note.description}</p>
            <p className="text-sm font-medium text-pink-600 mt-2">+${note.price}</p>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Custom Fragrance Builder</h1>
            <p className="text-gray-600">Create your unique signature scent</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm text-gray-500">{currentStep}/4</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-pink-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 4) * 100}%` }}
              ></div>
            </div>
          </div>

          {currentStep === 1 && (
            <div>
              <h2 className="text-2xl font-semibold mb-6">Step 1: Choose Your Top Notes</h2>
              <p className="text-gray-600 mb-6">Top notes are the first impression of your fragrance (select 1-3)</p>
              {renderNoteSelection("top", "Top Notes")}
              <div className="flex justify-between">
                <div></div>
                <button
                  onClick={() => setCurrentStep(2)}
                  disabled={selectedNotes.top.length === 0}
                  className="bg-pink-600 text-white px-6 py-2 rounded-md hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next: Heart Notes
                </button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <h2 className="text-2xl font-semibold mb-6">Step 2: Choose Your Heart Notes</h2>
              <p className="text-gray-600 mb-6">Heart notes form the core of your fragrance (select 1-3)</p>
              {renderNoteSelection("heart", "Heart Notes")}
              <div className="flex justify-between">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400"
                >
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  disabled={selectedNotes.heart.length === 0}
                  className="bg-pink-600 text-white px-6 py-2 rounded-md hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next: Base Notes
                </button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <h2 className="text-2xl font-semibold mb-6">Step 3: Choose Your Base Notes</h2>
              <p className="text-gray-600 mb-6">Base notes provide lasting foundation (select 1-3)</p>
              {renderNoteSelection("base", "Base Notes")}
              <div className="flex justify-between">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400"
                >
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep(4)}
                  disabled={selectedNotes.base.length === 0}
                  className="bg-pink-600 text-white px-6 py-2 rounded-md hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next: Customize
                </button>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div>
              <h2 className="text-2xl font-semibold mb-6">Step 4: Finalize Your Creation</h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fragrance Name</label>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="My Custom Fragrance"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Intensity: {intensity}%</label>
                    <input
                      type="range"
                      min="20"
                      max="80"
                      value={intensity}
                      onChange={(e) => setIntensity(Number.parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Light</span>
                      <span>Strong</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Your Custom Fragrance</h3>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-700">Top Notes:</h4>
                      <p className="text-sm text-gray-600">
                        {selectedNotes.top.map((note) => note.name).join(", ") || "None selected"}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-700">Heart Notes:</h4>
                      <p className="text-sm text-gray-600">
                        {selectedNotes.heart.map((note) => note.name).join(", ") || "None selected"}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-700">Base Notes:</h4>
                      <p className="text-sm text-gray-600">
                        {selectedNotes.base.map((note) => note.name).join(", ") || "None selected"}
                      </p>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Total Notes:</span>
                        <span>{getTotalNotes()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Intensity:</span>
                        <span>{intensity}%</span>
                      </div>
                      <div className="flex justify-between items-center text-lg font-bold text-pink-600">
                        <span>Total Price:</span>
                        <span>${calculatePrice()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <button
                  onClick={() => setCurrentStep(3)}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400"
                >
                  Back
                </button>
                <button
                  disabled={!customName || getTotalNotes() === 0}
                  className="bg-pink-600 text-white px-8 py-2 rounded-md hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add to Cart - ${calculatePrice()}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FragranceBuilder
