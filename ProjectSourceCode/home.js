const filterButtons = document.querySelectorAll('.search-type .btn:not(.btn-upload)');

filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    filterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

const postFeed = document.getElementById("postFeed");

// Load posts from backend
async function loadFeed() {
  try {
    const response = await fetch("/api/posts");
    const result = await response.json();

    if (result.status !== "success") {
      postFeed.innerHTML = '<div class="alert alert-warning">Unable to load posts. Please try again later.</div>';
      return;
    }

    postFeed.innerHTML = "";
    
    // Add the search type buttons at the top
    const searchTypeDiv = document.createElement("div");
    searchTypeDiv.className = "pt-3 pb-2";
    searchTypeDiv.innerHTML = `
      <div class="search-type">
        <button class="btn btn-outline-secondary rounded-pill btn-sm active">For you</button>
        <button class="btn btn-outline-secondary rounded-pill btn-sm">Recent</button>
        <button class="btn btn-outline-secondary rounded-pill btn-sm">Nearby</button>
        <button class="btn btn-outline-secondary rounded-pill btn-sm">Trending</button>
        <button class="btn btn-outline-secondary rounded-pill btn-sm">Size</button>
        <a href="upload.html" class="btn btn-secondary btn-upload">Upload</a>
      </div>
    `;
    postFeed.appendChild(searchTypeDiv);

    if (result.data.length === 0) {
      const emptyMessage = document.createElement("div");
      emptyMessage.className = "text-center py-5 text-muted";
      emptyMessage.innerHTML = '<p>No posts yet. Be the first to share a catch!</p>';
      postFeed.appendChild(emptyMessage);
      return;
    }

    result.data.forEach(post => {
      const card = document.createElement("div");
      card.className = "card mb-4";

      card.innerHTML = `
        <img src="${post.image_path}" class="card-img-top" alt="Post Image" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23ddd%22 width=%22100%22 height=%22100%22/%3E%3Ctext fill=%22%23999%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22%3ENo Image%3C/text%3E%3C/svg%3E'">

        <div class="card-body">
          <h5 class="card-title">${post.username}</h5>
          <p class="card-text">${post.caption || ""}</p>
          <p class="text-muted">
            ${new Date(post.date_created).toLocaleDateString()}
          </p>

          <hr>

          <h6>Comments</h6>
          <div id="comments-${post.post_id}" class="comments-section mb-3">
            <div class="text-muted">Loading comments...</div>
          </div>

          <!-- Comment input form -->
          <div class="comment-form">
            <textarea 
              id="comment-input-${post.post_id}" 
              class="form-control mb-2" 
              rows="2" 
              placeholder="Write a comment..."
            ></textarea>
            <button 
              class="btn btn-primary btn-sm" 
              onclick="postComment(${post.post_id})"
            >
              Post Comment
            </button>
          </div>
        </div>
      `;
      postFeed.appendChild(card);

      // Load comments for this post
      loadComments(post.post_id);
    });

  } catch (err) {
    console.error("Feed load error:", err);
    postFeed.innerHTML = '<div class="alert alert-danger">Error loading posts. Please check your connection and try again.</div>';
  }
}

// Load comments for a specific post
async function loadComments(postId) {
  try {
    const response = await fetch(`/api/posts/${postId}/comments`);
    const result = await response.json();

    const commentsContainer = document.getElementById(`comments-${postId}`);

    if (result.status !== "success" || !result.data || result.data.length === 0) {
      commentsContainer.innerHTML = '<div class="text-muted small">No comments yet. Be the first to comment!</div>';
      return;
    }

    // Render comments
    commentsContainer.innerHTML = result.data.map(comment => {
      const dateStr = comment.date_created 
        ? new Date(comment.date_created).toLocaleString() 
        : 'Just now';
      
      return `
        <div class="comment mb-2 p-2 border-bottom">
          <strong>${comment.username}</strong>
          <p class="mb-1">${comment.comment_text}</p>
          <small class="text-muted">${dateStr}</small>
        </div>
      `;
    }).join('');

  } catch (err) {
    console.error("Comments load error:", err);
    document.getElementById(`comments-${postId}`).innerHTML = 
      '<div class="text-danger small">Failed to load comments</div>';
  }
}

// Post a new comment
async function postComment(postId) {
  const textarea = document.getElementById(`comment-input-${postId}`);
  const commentText = textarea.value.trim();

  if (!commentText) {
    alert("Comment cannot be empty!");
    return;
  }

  try {
    const response = await fetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ comment_text: commentText })
    });

    const result = await response.json();

    if (result.status === "success") {
      // Clear textarea
      textarea.value = "";
      
      // Reload comments to show the new one
      loadComments(postId);
    } else {
      alert(result.message || "Failed to post comment");
    }

  } catch (err) {
    console.error("Comment post error:", err);
    alert("Error posting comment. Please try again.");
  }
}

// Load feed on startup
window.addEventListener("DOMContentLoaded", loadFeed);