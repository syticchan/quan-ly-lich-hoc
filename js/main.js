document.addEventListener("DOMContentLoaded", function () {
    const loginBtn = document.getElementById("loginBtn");
    const logoutBtn = document.getElementById("logoutBtn");

    function updateNavbar() {
        const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
        if (loginBtn) {
            loginBtn.hidden = isLoggedIn;
        }
        if (logoutBtn) {
            logoutBtn.hidden = !isLoggedIn;
        }
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", function () {
            localStorage.removeItem("isLoggedIn");
            window.location.replace("dangnhap.html");
        });
    }

    const currentPage = window.location.pathname.split("/").pop() || "trangchu.html";
    document.querySelectorAll(".nav-links a").forEach(function (link) {
        link.classList.toggle("active", link.getAttribute("href") === currentPage);
    });

    updateNavbar();
});