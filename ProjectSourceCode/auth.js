// Authentication helper for frontend pages

async function checkAuth() {
  try {
    const response = await fetch('/api/auth/check');
    const result = await response.json();
    
    if (!result.authenticated) {
      // User not logged in, redirect to login
      window.location.href = '/login.html';
      return null;
    }
    
    return result.user;
  } catch (error) {
    console.error('Auth check failed:', error);
    window.location.href = '/login.html';
    return null;
  }
}

function updateNavbarWithUser(user) {
  const loginButton = document.querySelector('a[href="login.html"]');
  if (loginButton && user) {
    loginButton.innerHTML = `${user.username} <span class="badge bg-light text-dark ms-1">Logout</span>`;
    loginButton.href = '/logout';
  }
}
