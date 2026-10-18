// Tự động đánh dấu mục menu đang mở theo tên file hiện tại
(function () {
    var current = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(function (a) {
        a.classList.toggle('active', a.getAttribute('href') === current);
    });
})();
document.addEventListener("DOMContentLoaded", function () {
    const loginBtn = document.getElementById("loginBtn");
    const logoutBtn = document.getElementById("logoutBtn");

    // Kiểm tra trạng thái đăng nhập
    function updateNavbar() {
        const isLoggedIn =
            localStorage.getItem("isLoggedIn") === "true";

        if (loginBtn) {
            loginBtn.hidden = isLoggedIn;
        }

        if (logoutBtn) {
            logoutBtn.hidden = !isLoggedIn;
        }
    }

    // Đăng xuất
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function () {
            localStorage.removeItem("isLoggedIn");

            // Xóa thông tin phiên nếu dự án có sử dụng
            window.location.href = "index.html";
        });
    }

    // Đánh dấu trang hiện tại trên navbar
    const currentPage = window.location.pathname.split("/").pop()
        || "index.html";

    document.querySelectorAll(".nav-links a").forEach(link => {
        const linkPage = link.getAttribute("href");

        link.classList.toggle("active", linkPage === currentPage);
    });

    updateNavbar();
});
