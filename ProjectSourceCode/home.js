const filterButtons = document.querySelectorAll('.search-type .btn:not(.btn-upload)');
let allPosts = []; // Store all posts for filtering
let currentFilter = 'For you'; // Track current filter

filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    filterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.textContent.trim();
    applyFilter(currentFilter);
  });
});

const postFeed = document.getElementById("postFeed");

// Apply filter to posts
function applyFilter(filterType) {
  if (!allPosts || allPosts.length === 0) {
    return;
  }

  let filteredPosts = [...allPosts];

  switch(filterType) {
    case 'Recent':
      // Sort by most recent
      filteredPosts.sort((a, b) => 
        new Date(b.date_created) - new Date(a.date_created)
      );
      break;
    
    case 'Trending':
      // Sort by most recent (could add like/comment counts later)
      filteredPosts.sort((a, b) => 
        new Date(b.date_created) - new Date(a.date_created)
      );
      break;
    
    case 'Size':
      // Sort by fish_weight (largest first), filter out posts without weight
      filteredPosts = filteredPosts
        .filter(post => post.fish_weight != null && post.fish_weight > 0)
        .sort((a, b) => (b.fish_weight || 0) - (a.fish_weight || 0));
      break;
    
    case 'Nearby':
      // Filter posts that have location data
      filteredPosts = filteredPosts.filter(post => 
        post.x_coord != null && post.y_coord != null
      );
      break;
    
    case 'For you':
    default:
      // Show all posts (default order from backend)
      break;
  }

  renderPosts(filteredPosts);
}

// Render posts to the feed
function renderPosts(posts) {
  // Keep filter buttons, remove existing posts
  const existingCards = postFeed.querySelectorAll('.card');
  existingCards.forEach(card => card.remove());
  
  // Remove empty/loading messages if they exist
  const messages = postFeed.querySelectorAll('.text-center.py-5');
  messages.forEach(msg => {
    // Don't remove the filter buttons container
    if (!msg.closest('.pt-3.pb-2')) {
      msg.remove();
    }
  });

  if (posts.length === 0) {
    const emptyMessage = document.createElement("div");
    emptyMessage.className = "text-center py-5 text-muted";
    emptyMessage.innerHTML = '<p>No posts match this filter.</p>';
    postFeed.appendChild(emptyMessage);
    return;
  }

  posts.forEach(post => {
    const card = document.createElement("div");
    card.className = "card mb-4";

    // Add fish info if available
    let fishInfo = '';
    if (post.fish_species || post.fish_weight) {
      fishInfo = '<div class="mb-2">';
      if (post.fish_species) {
        fishInfo += `<span class="badge bg-info me-2">${post.fish_species}</span>`;
      }
      if (post.fish_weight) {
        fishInfo += `<span class="badge bg-success">${post.fish_weight} lbs</span>`;
      }
      fishInfo += '</div>';
    }

    // Add location badge if available
    let locationBadge = '';
    if (post.x_coord && post.y_coord) {
      locationBadge = `<span class="badge bg-secondary">📍 Located</span>`;
    }

    card.innerHTML = `
      <img src="${post.image_path}" class="card-img-top" alt="Post Image" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23ddd%22 width=%22100%22 height=%22100%22/%3E%3Ctext fill=%22%23999%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22%3ENo Image%3C/text%3E%3C/svg%3E'">

      <div class="card-body">
        <h5 class="card-title">${post.username} ${locationBadge}</h5>
        ${fishInfo}
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
}

// Load posts from backend
async function loadFeed() {
  try {
    const response = await fetch("/api/posts");
    const result = await response.json();

    if (result.status !== "success") {
      // Clear only posts, keep filter buttons
      const existingCards = postFeed.querySelectorAll('.card');
      existingCards.forEach(card => card.remove());
      const emptyMsg = postFeed.querySelector('.text-center.py-5');
      if (emptyMsg) emptyMsg.remove();
      
      const alertDiv = document.createElement('div');
      alertDiv.className = 'alert alert-warning';
      alertDiv.textContent = 'Unable to load posts. Please try again later.';
      postFeed.appendChild(alertDiv);
      return;
    }

    // Clear existing posts and messages, but keep filter buttons
    const existingCards = postFeed.querySelectorAll('.card');
    existingCards.forEach(card => card.remove());
    
    // Remove loading spinner and empty messages
    const messages = postFeed.querySelectorAll('.text-center.py-5');
    messages.forEach(msg => msg.remove());

    if (result.data.length === 0) {
      const emptyMessage = document.createElement("div");
      emptyMessage.className = "text-center py-5 text-muted";
      emptyMessage.innerHTML = '<p>No posts yet. Be the first to share a catch!</p>';
      postFeed.appendChild(emptyMessage);
      allPosts = []; // Set to empty array
      return;
    }

    // Store all posts and render with current filter
    allPosts = result.data;
    applyFilter(currentFilter);

  } catch (err) {
    console.error("Feed load error:", err);
    // Clear only posts, keep filter buttons
    const existingCards = postFeed.querySelectorAll('.card');
    existingCards.forEach(card => card.remove());
    const messages = postFeed.querySelectorAll('.text-center.py-5, .alert');
    messages.forEach(msg => msg.remove());
    
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger';
    alertDiv.textContent = 'Error loading posts. Please check your connection and try again.';
    postFeed.appendChild(alertDiv);
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