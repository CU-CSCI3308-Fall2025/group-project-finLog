  document.getElementById("uploadForm").addEventListener("submit", async (e) => {
    e.preventDefault(); // Prevent the default form submission behavior

    const form = e.target;
    const formData = new FormData(form); // Collect form data

    try {
      const response = await fetch("/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        alert("Post uploaded successfully!");
        console.log(result); // Handle the server response
        
        // Optionally reset the form
        form.reset();
        
        // Optionally redirect to dashboard or feed
        // window.location.href = '/dashboard.html';
      } else {
        const error = await response.json();
        alert(`Failed to upload post: ${error.message}`);
        console.error("Error:", error);
      }
    } catch (error) {
      alert("An error occurred while uploading the post.");
      console.error("Error:", error);
    }
  });
