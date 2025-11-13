const filterButtons = document.querySelectorAll('.search-type .btn:not(.btn-upload)');

filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    filterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});
