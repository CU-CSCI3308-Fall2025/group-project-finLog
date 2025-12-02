let aiAnalysisData = null;
let currentImageFile = null;

// Enable Analyze button when image is selected
document.getElementById('imageInput').addEventListener('change', (e) => {
  const analyzeButton = document.getElementById('analyzeButton');
  const analyzeButtonText = document.getElementById('analyzeButtonText');
  
  if (e.target.files && e.target.files[0]) {
    currentImageFile = e.target.files[0];
    analyzeButton.disabled = false;
    analyzeButtonText.textContent = 'Analyze Image with AI';
    
    // Reset previous analysis
    aiAnalysisData = null;
    document.getElementById('fishSpeciesInput').value = '';
    document.getElementById('aiResultsContainer').style.display = 'none';
    document.getElementById('submitButton').disabled = true;
    document.getElementById('submitButtonText').textContent = 'Analyze image first';
  } else {
    currentImageFile = null;
    analyzeButton.disabled = true;
    analyzeButtonText.textContent = 'Select an image first';
  }
});

// Analyze button handler
document.getElementById('analyzeButton').addEventListener('click', async () => {
  if (!currentImageFile) {
    alert('Please select an image first');
    return;
  }
  
  const analyzeButton = document.getElementById('analyzeButton');
  const analyzeButtonText = document.getElementById('analyzeButtonText');
  const resultsContainer = document.getElementById('aiResultsContainer');
  const aiResults = document.getElementById('aiResults');
  
  // Show loading state
  analyzeButton.disabled = true;
  analyzeButtonText.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Analyzing...';
  resultsContainer.style.display = 'block';
  aiResults.innerHTML = `
    <div class="spinner-border spinner-border-sm" role="status">
      <span class="visually-hidden">Analyzing...</span>
    </div>
    <span class="ms-2">Analyzing image with AI...</span>
  `;
  
  try {
    // Create FormData with just the image
    const formData = new FormData();
    formData.append('image', currentImageFile);
    
    const response = await fetch('/api/analyze-image', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (response.ok && result.status === 'success') {
      aiAnalysisData = result.data;
      
      // Display the formatted HTML
      aiResults.innerHTML = result.aiAnalysisHTML;
      
      // Auto-fill the species field
      document.getElementById('fishSpeciesInput').value = aiAnalysisData.species;
      
      // Enable submit button
      document.getElementById('submitButton').disabled = false;
      document.getElementById('submitButtonText').textContent = 'Submit Post';
      
      // Reset analyze button
      analyzeButton.disabled = false;
      analyzeButtonText.textContent = 'Re-analyze Image';
      
    } else if (result.status === 'not_fish') {
      // Image is not a fish - block posting
      aiResults.innerHTML = `
        <div class="alert alert-danger">
          <strong>Not a Fish!</strong>
          <p class="mb-0">${result.message}</p>
        </div>
      `;
      
      // Keep submit disabled
      document.getElementById('submitButton').disabled = true;
      document.getElementById('submitButtonText').textContent = 'Cannot post: Image must contain a fish';
      
      // Re-enable analyze button
      analyzeButton.disabled = false;
      analyzeButtonText.textContent = 'Try Another Image';
      
    } else {
      throw new Error(result.message || 'Analysis failed');
    }
    
  } catch (error) {
    console.error('Analysis error:', error);
    aiResults.innerHTML = `
      <div class="alert alert-danger">
        <strong>Analysis Failed</strong>
        <p class="mb-0">Could not analyze the image. Please try again.</p>
      </div>
    `;
    
    analyzeButton.disabled = false;
    analyzeButtonText.textContent = 'Retry Analysis';
  }
});

// Form submission handler
document.getElementById("uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  if (!aiAnalysisData) {
    alert('Please analyze the image first before submitting.');
    return;
  }

  const form = e.target;
  const formData = new FormData(form);
  
  // Add the AI analysis data to the form
  formData.append('aiAnalysisData', JSON.stringify(aiAnalysisData));
  
  const submitButton = document.getElementById('submitButton');
  const submitButtonText = document.getElementById('submitButtonText');
  submitButton.disabled = true;
  submitButtonText.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Uploading...';

  try {
    const response = await fetch("/upload", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const result = await response.json();
      alert("Post uploaded successfully!");
      window.location.href = "dashboard.html";
    } else {
      const error = await response.json();
      alert(`Failed to upload post: ${error.message}`);
      submitButton.disabled = false;
      submitButtonText.textContent = 'Submit Post';
    }
  } catch (error) {
    alert("An error occurred while uploading the post.");
    console.error("Error:", error);
    submitButton.disabled = false;
    submitButtonText.textContent = 'Submit Post';
  }
});
