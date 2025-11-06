  document.getElementById("uploadForm").addEventListener("submit", async (e) => {
    e.preventDefault(); // Prevent the default form submission behavior

    const form = e.target;
    const formData = new FormData(form); // Collect form data

    try {
      const response = await fetch("https://your-server-endpoint/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        alert("Post uploaded successfully!");
        console.log(result); // Handle the server response
      } else {
        alert("Failed to upload post. Please try again.");
        console.error("Error:", response.statusText);
      }
    } catch (error) {
      alert("An error occurred while uploading the post.");
      console.error("Error:", error);
    }
  });
