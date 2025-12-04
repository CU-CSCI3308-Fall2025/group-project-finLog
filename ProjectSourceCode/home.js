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
      // Sort by comment count (most comments first)
      filteredPosts.sort((a, b) => 
        (b.comment_count || 0) - (a.comment_count || 0)
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
    card.className = "card mb-3";

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
      locationBadge = `<span class="badge bg-secondary ms-2">📍 Located</span>`;
    }

    card.innerHTML = `
      <div class="row g-0">
        <div class="col-md-8">
          <img src="${post.image_path}" class="img-fluid rounded-start post-image" alt="Post Image" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23ddd%22 width=%22100%22 height=%22100%22/%3E%3Ctext fill=%22%23999%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22%3ENo Image%3C/text%3E%3C/svg%3E'">
        </div>
        <div class="col-md-4">
          <div class="card-body">
            <h6 class="card-title mb-2">
              <strong>${post.username}</strong>${locationBadge}
            </h6>
            ${fishInfo}
            <p class="card-text mb-2">${post.caption || ""}</p>
            <p class="text-muted small mb-3">
              ${new Date(post.date_created).toLocaleDateString()}
            </p>

            <!-- Like Button -->
            <div class="d-flex align-items-center mb-3">
              <button 
                class="btn btn-sm btn-outline-danger like-btn" 
                id="like-btn-${post.post_id}"
                onclick="toggleLike(${post.post_id})"
              >
                <i class="bi bi-heart"></i>
                <span id="like-count-${post.post_id}">${post.like_count || 0}</span>
              </button>
              <span class="ms-3 text-muted small">
                <i class="bi bi-chat"></i> ${post.comment_count || 0} comments
              </span>
            </div>

            <hr class="my-2">

            <h6 class="mb-2">Comments</h6>
            <div id="comments-${post.post_id}" class="comments-section mb-2" style="max-height: 150px; overflow-y: auto;">
              <div class="text-muted small">Loading comments...</div>
            </div>

            <!-- Comment input form -->
            <div class="comment-form">
              <textarea 
                id="comment-input-${post.post_id}" 
                class="form-control form-control-sm mb-2" 
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

// Toggle like on a post
async function toggleLike(postId) {
  try {
    const response = await fetch(`/api/posts/${postId}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (response.status === 401) {
      alert('Please login to like posts!');
      return;
    }

    if (result.status === 'success') {
      // Update the button appearance
      const likeBtn = document.getElementById(`like-btn-${postId}`);
      const likeCountSpan = document.getElementById(`like-count-${postId}`);
      const currentCount = parseInt(likeCountSpan.textContent);
      
      if (result.liked) {
        // User just liked the post
        likeBtn.classList.remove('btn-outline-danger');
        likeBtn.classList.add('btn-danger');
        likeBtn.innerHTML = `<i class="bi bi-heart-fill"></i> <span id="like-count-${postId}">${currentCount + 1}</span>`;
      } else {
        // User just unliked the post
        likeBtn.classList.remove('btn-danger');
        likeBtn.classList.add('btn-outline-danger');
        likeBtn.innerHTML = `<i class="bi bi-heart"></i> <span id="like-count-${postId}">${currentCount - 1}</span>`;
      }
    }

  } catch (err) {
    console.error('Error toggling like:', err);
    alert('Error liking post. Please try again.');
  }
}

// --- SEARCH BAR FUNCTIONALITY ---
const searchInput = document.querySelector('.search-bar');

// Allow pressing Enter to trigger search instead of submitting form
searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault(); // stop page refresh
    const query = searchInput.value.trim().toLowerCase();

    if (!query) {
      applyFilter(currentFilter);
      return;
    }

    const filtered = allPosts.filter(post => {
      return (
        (post.username && post.username.toLowerCase().includes(query)) ||
        (post.caption && post.caption.toLowerCase().includes(query)) ||
        (post.fish_species && post.fish_species.toLowerCase().includes(query)) ||
        (post.x_coord && `${post.x_coord}`.includes(query)) ||
        (post.y_coord && `${post.y_coord}`.includes(query))
      );
    });

    renderPosts(filtered);
  }
});

// Load feed on startup
window.addEventListener("DOMContentLoaded", loadFeed);