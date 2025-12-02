// ===========================
// AI RESPONSE PARSER
// ===========================
// Handles parsing and validation of AI-generated JSON responses

/**
 * Parse AI response text into structured JSON
 * @param {string} aiResponseText - Raw text response from AI
 * @returns {object|null} Parsed fish analysis object or null if parsing fails
 */
const parseAIResponse = (aiResponseText) => {
  if (!aiResponseText) {
    console.error('AI Parser: No response text provided');
    return null;
  }

  try {
    // Remove markdown code blocks if present (```json ... ```)
    let cleanedText = aiResponseText.trim();
    cleanedText = cleanedText.replace(/```json\n?/g, '');
    cleanedText = cleanedText.replace(/```\n?/g, '');
    cleanedText = cleanedText.trim();

    // Parse the JSON
    const parsed = JSON.parse(cleanedText);

    // Check if this is a "not fish" response
    if (parsed.isFish === false) {
      return {
        isFish: false,
        reason: sanitizeString(parsed.reason) || 'This image does not appear to contain a fish.'
      };
    }
    
    // It's a fish - validate the full structure
    const validated = validateFishAnalysis(parsed);
    
    return validated;
  } catch (error) {
    console.error('AI Parser: Failed to parse JSON response', error);
    console.error('AI Parser: Raw response:', aiResponseText);
    
    // Return a fallback structure with the raw text
    return {
      species: 'Unknown',
      scientificName: 'N/A',
      confidence: 'low',
      characteristics: [],
      habitat: 'N/A',
      size: 'N/A',
      additionalInfo: aiResponseText,
      parseError: true,
      isFish: true // Assume it's a fish if we can't parse
    };
  }
};

/**
 * Validate and sanitize the parsed fish analysis object
 * @param {object} data - Parsed JSON data
 * @returns {object} Validated fish analysis object
 */
const validateFishAnalysis = (data) => {
  // Ensure all required fields exist with default values
  const validated = {
    isFish: data.isFish !== false, // Assume true unless explicitly false
    species: sanitizeString(data.species) || 'Unknown',
    scientificName: sanitizeString(data.scientificName) || 'N/A',
    confidence: validateConfidence(data.confidence),
    characteristics: validateArray(data.characteristics),
    habitat: sanitizeString(data.habitat) || 'N/A',
    size: sanitizeString(data.size) || 'N/A',
    regulations: validateRegulations(data.regulations),
    additionalInfo: sanitizeString(data.additionalInfo) || '',
    parseError: false
  };

  return validated;
};

/**
 * Sanitize string input to prevent XSS and ensure valid content
 * @param {any} value - Input value to sanitize
 * @returns {string} Sanitized string
 */
const sanitizeString = (value) => {
  if (typeof value !== 'string') {
    return String(value || '');
  }
  
  // Basic HTML entity encoding to prevent XSS
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
};

/**
 * Validate confidence level
 * @param {string} confidence - Confidence value from AI
 * @returns {string} Valid confidence level (high/medium/low)
 */
const validateConfidence = (confidence) => {
  const validLevels = ['high', 'medium', 'low'];
  const normalized = String(confidence || '').toLowerCase().trim();
  
  return validLevels.includes(normalized) ? normalized : 'low';
};

/**
 * Validate and sanitize array values
 * @param {any} arr - Input array
 * @returns {array} Validated array of strings
 */
const validateArray = (arr) => {
  if (!Array.isArray(arr)) {
    return [];
  }
  
  return arr
    .filter(item => item !== null && item !== undefined)
    .map(item => sanitizeString(item))
    .filter(item => item.length > 0)
    .slice(0, 20); // Limit to 20 items max
};

/**
 * Validate and sanitize regulations object
 * @param {object} regs - Regulations object from AI
 * @returns {object} Validated regulations object
 */
const validateRegulations = (regs) => {
  if (!regs || typeof regs !== 'object') {
    return {
      canKeep: 'unknown',
      minimumSize: 'not specified',
      maximumSize: 'not specified',
      seasonalRestrictions: 'check local regulations',
      bagLimit: 'check local regulations',
      specialRules: 'Check local regulations'
    };
  }
  
  return {
    canKeep: sanitizeString(regs.canKeep) || 'unknown',
    minimumSize: sanitizeString(regs.minimumSize) || 'not specified',
    maximumSize: sanitizeString(regs.maximumSize) || 'not specified',
    seasonalRestrictions: sanitizeString(regs.seasonalRestrictions) || 'check local regulations',
    bagLimit: sanitizeString(regs.bagLimit) || 'check local regulations',
    specialRules: sanitizeString(regs.specialRules) || 'Check local regulations'
  };
};

/**
 * Format the parsed analysis into a user-friendly HTML string
 * @param {object} analysis - Validated fish analysis object
 * @returns {string} Formatted HTML string
 */
const formatAnalysisForDisplay = (analysis) => {
  if (!analysis) {
    return '<p class="text-muted">No analysis available</p>';
  }

  if (analysis.parseError) {
    return `
      <div class="alert alert-warning">
        <strong>Note:</strong> Could not parse structured data. Raw AI response:
        <p class="mt-2">${analysis.additionalInfo}</p>
      </div>
    `;
  }

  const confidenceBadge = {
    high: 'success',
    medium: 'warning',
    low: 'secondary'
  }[analysis.confidence] || 'secondary';
  
  // Determine keep status badge color
  const keepStatusBadge = {
    'yes': 'success',
    'no': 'danger',
    'conditional': 'warning',
    'unknown': 'secondary'
  }[analysis.regulations.canKeep.toLowerCase()] || 'secondary';

  let html = `
    <div class="fish-analysis">
      <h6 class="mb-3">
        ${analysis.species} 
        <span class="badge bg-${confidenceBadge}">${analysis.confidence} confidence</span>
      </h6>
      
      ${analysis.scientificName !== 'N/A' ? `
        <p class="text-muted fst-italic mb-2">${analysis.scientificName}</p>
      ` : ''}
      
      ${analysis.characteristics.length > 0 ? `
        <div class="mb-3">
          <strong>Characteristics:</strong>
          <ul class="mb-0 mt-1">
            ${analysis.characteristics.map(c => `<li>${c}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      
      ${analysis.habitat !== 'N/A' ? `
        <div class="mb-2">
          <strong>Habitat:</strong> ${analysis.habitat}
        </div>
      ` : ''}
      
      ${analysis.size !== 'N/A' ? `
        <div class="mb-2">
          <strong>Typical Size:</strong> ${analysis.size}
        </div>
      ` : ''}
      
      <div class="card mt-3 mb-3 border-info">
        <div class="card-header bg-info text-white">
          <strong>🎣 US Fishing Regulations</strong>
        </div>
        <div class="card-body">
          <div class="mb-2">
            <strong>Can Keep:</strong> 
            <span class="badge bg-${keepStatusBadge}">${analysis.regulations.canKeep}</span>
          </div>
          
          ${analysis.regulations.minimumSize !== 'none' ? `
            <div class="mb-2">
              <strong>Minimum Size:</strong> ${analysis.regulations.minimumSize}
            </div>
          ` : ''}
          
          ${analysis.regulations.maximumSize !== 'none' ? `
            <div class="mb-2">
              <strong>Maximum Size:</strong> ${analysis.regulations.maximumSize}
            </div>
          ` : ''}
          
          ${analysis.regulations.bagLimit !== 'none' ? `
            <div class="mb-2">
              <strong>Bag Limit:</strong> ${analysis.regulations.bagLimit}
            </div>
          ` : ''}
          
          ${analysis.regulations.seasonalRestrictions !== 'none' ? `
            <div class="mb-2">
              <strong>Seasonal Restrictions:</strong> ${analysis.regulations.seasonalRestrictions}
            </div>
          ` : ''}
          
          ${analysis.regulations.specialRules !== 'none' && analysis.regulations.specialRules !== 'Check local regulations' ? `
            <div class="mb-2">
              <strong>Special Rules:</strong> ${analysis.regulations.specialRules}
            </div>
          ` : ''}
          
          <div class="alert alert-warning mb-0 mt-3">
            <small><strong>⚠️ Important:</strong> Always verify current local and state regulations before fishing. Rules vary by location and can change.</small>
          </div>
        </div>
      </div>
      
      ${analysis.additionalInfo ? `
        <div class="mt-3">
          <strong>Additional Information:</strong>
          <p class="mb-0">${analysis.additionalInfo}</p>
        </div>
      ` : ''}
    </div>
  `;

  return html;
};

// Export parsing functions
module.exports = {
  parseAIResponse,
  validateFishAnalysis,
  formatAnalysisForDisplay,
  sanitizeString
};
