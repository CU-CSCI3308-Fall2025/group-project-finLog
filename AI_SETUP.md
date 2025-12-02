# AI Fish Analysis Setup

## Overview
The upload page now includes an optional AI analysis feature that uses Google's Gemini AI to identify and provide information about fish in uploaded images.

## Setup Instructions

### 1. Get Your Gemini API Key
1. Visit [Google AI Studio](https://aistudio.google.com/api-keys)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### 2. Add API Key to Environment
1. Open your `.env` file (create one if it doesn't exist by copying `.env.example`)
2. Add the following line:
   ```
   GEMINI_API_KEY="your-api-key-here"
   ```
3. Replace `your-api-key-here` with your actual API key

### 3. Restart the Server
If your server is running, restart it to load the new environment variable:
```bash
docker-compose down
docker-compose up
```

## How to Use

### For Users
1. Go to the Upload page
2. Select an image of a fish
3. Check the box "Use AI to analyze the fish in this image"
4. Fill out the rest of the form
5. Click Submit
6. The AI analysis will appear on the page showing information about the fish species, characteristics, habitat, and more

### Features
- **Optional**: AI analysis is only performed when the checkbox is checked
- **Non-blocking**: If AI analysis fails, the post still uploads successfully
- **Informative**: Provides detailed information about fish species, characteristics, and habitat
- **Fast**: Uses Gemini 2.0 Flash for quick results

## API Limits (Free Tier)
- **RPM**: 10 requests per minute
- **RPD**: 250,000 requests per day
- More than sufficient for prototyping and small-scale use

## Model Information
- **Model**: gemini-2.0-flash-exp
- **Capability**: Text generation from multimodal input (images + text)
- **Use Case**: Visual question answering, object identification, image analysis
- **Speed**: Optimized for low latency

## Troubleshooting

### AI Analysis Not Working
1. Check that `GEMINI_API_KEY` is set in your `.env` file
2. Verify the API key is valid at [Google AI Studio](https://aistudio.google.com/api-keys)
3. Check the server logs for error messages
4. Ensure you haven't exceeded the rate limits (10 requests/minute)

### Post Uploads But No AI Results
- This is normal if the API key is not configured
- The post will still upload successfully
- AI analysis is optional and won't block uploads

## Technical Details

### Backend Implementation
- Located in `ProjectSourceCode/storeImage.js`
- `analyzeFishWithAI()` function handles the AI request
- Converts image to base64 and sends to Gemini API
- Prompt: "Return information on the fish in this image"

### Frontend Implementation
- Checkbox in `ProjectSourceCode/upload.html`
- JavaScript in `ProjectSourceCode/upload.js` handles the response
- Displays results in a styled card with alert formatting
- Shows loading spinner during analysis

### Request Flow
1. User checks AI checkbox and submits form
2. Frontend sends FormData with `useAI: 'on'`
3. Backend saves image and creates post
4. If `useAI` is set, backend calls `analyzeFishWithAI()`
5. AI analyzes image and returns text description
6. Response includes `aiAnalysis` field if available
7. Frontend displays results on the page
