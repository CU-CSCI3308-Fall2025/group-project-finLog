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
          <h5 class="card-title">@${post.username}</h5>
          <p class="card-text">${post.caption || ""}</p>
          <p class="text-muted">
            ${new Date(post.date_created).toLocaleDateString()}
          </p>

          <hr>

          <h6>Comments</h6>
          <div style="color: gray;">Comments coming soon...</div>
        </div>
      `;
      postFeed.appendChild(card);
    });

  } catch (err) {
    console.error("Feed load error:", err);
  }
}

// Load feed on startup
window.addEventListener("DOMContentLoaded", loadFeed);

