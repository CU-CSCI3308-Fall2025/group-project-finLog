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

    if (result.status !== "success") return;

    postFeed.innerHTML = "";

    result.data.forEach(post => {
      const card = document.createElement("div");
      card.className = "card mb-4";

      card.innerHTML = `
        <img src="${post.image_path}" class="card-img-top" alt="Post Image">

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