// Import required modules
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ===========================
// AI ANALYSIS FUNCTION
// ===========================
// Function to analyze fish image using Gemini AI
const analyzeFishWithAI = async (imagePath) => {
  try {
    // Initialize Gemini AI
        // Debug log (remove after confirming it works)
    console.log('API Key exists:', !!process.env.GEMINI_API_KEY);
    console.log('API Key length:', process.env.GEMINI_API_KEY?.length);
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    // Read the image file and convert to base64
    const imageData = fs.readFileSync(imagePath);
    const base64Image = imageData.toString('base64');
    
    // Prepare the prompt and image for analysis
    const prompt = `Analyze this image carefully. First, determine if this image contains a fish. If it does NOT contain a fish, return this exact JSON structure:
{
  "isFish": false,
  "reason": "brief explanation of what the image contains instead"
}

If the image DOES contain a fish, return this JSON structure:
{
  "isFish": true,
  "species": "common name of the fish species",
  "scientificName": "scientific/latin name",
  "confidence": "high/medium/low - your confidence in the identification",
  "characteristics": ["list", "of", "notable", "physical", "characteristics"],
  "habitat": "typical habitat description",
  "size": "typical size range",
  "regulations": {
    "canKeep": "yes/no/conditional - whether this fish can typically be kept in the US",
    "minimumSize": "provide typical/average minimum size across US states (e.g., '12-15 inches in most states') or 'none' if no minimum. Do NOT just say 'varies by state'",
    "maximumSize": "provide typical/average maximum size if applicable (e.g., '20-24 inches in most states') or 'none' if no maximum. Do NOT just say 'varies by state'",
    "seasonalRestrictions": "provide common seasonal patterns (e.g., 'typically open year-round' or 'often closed March-May for spawning') or 'none'. Do NOT just say 'varies by state'",
    "bagLimit": "provide typical bag limits (e.g., '5-10 fish per day in most states') or 'none' if unlimited. Do NOT just say 'varies by state'",
    "specialRules": "any special rules like slot limits, gender restrictions, or catch-and-release only zones. Provide specific examples where common."
  },
  "additionalInfo": "any other relevant information"
}

IMPORTANT: For regulations, provide actual typical values, ranges, or common patterns across US states rather than saying "varies by state". Only return valid JSON, no additional text or markdown formatting.`;
    
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: "image/jpeg" // You might want to detect this from the file extension
      }
    };
    
    // Generate content with the image and prompt
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('AI Analysis Error:', error);
    return null;
  }
};

// Export the AI functions
module.exports = { analyzeFishWithAI };
