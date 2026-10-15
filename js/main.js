// Tự động đánh dấu mục menu đang mở theo tên file hiện tại
(function () {
    var current = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(function (a) {
        a.classList.toggle('active', a.getAttribute('href') === current);
    });
})();