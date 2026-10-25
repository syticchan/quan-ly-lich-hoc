const EMPTY_VALUE = "Chưa có";

const TEMPLATE_USER = {
    name: "Nguyễn Văn A",
    studentId: "123456789",
    email: "sinhvien@gmail.com",
    school: "Đại học Giao thông vận tải",
    faculty: "Khoa Công nghệ thông tin",
    className: "Công nghệ thông tin 2 - K66",
    password: "Password1"
};

function getUsers() {
    try {
        const users = JSON.parse(localStorage.getItem("users"));
        return Array.isArray(users) ? users : [];
    } catch (error) {
        return [];
    }
}

function saveUsers(users) {
    localStorage.setItem("users", JSON.stringify(users));
}

function ensureTemplateUser() {
    try {
        const users = getUsers();

        if (!users.some(function (user) {
            return user.studentId === TEMPLATE_USER.studentId;
        })) {
            users.push(Object.assign({}, TEMPLATE_USER));
            saveUsers(users);
        }
    } catch (error) {
        console.warn("Không thể tạo tài khoản mẫu.");
    }
}

function getCurrentUser() {
    const studentId = localStorage.getItem("loggedInUser");

    return getUsers().find(function (user) {
        return user.studentId === studentId;
    }) || null;
}

function normalizeName(value) {
    return String(value).normalize("NFC").trim().replace(/\s+/g, " ");
}

function isValidName(value) {
    return /^\p{Lu}\p{L}*(\s\p{Lu}\p{L}*)*$/u.test(normalizeName(value));
}

function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidStudentId(value) {
    return /^\d{9}$/.test(value);
}

function isValidPassword(value) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)\S{8,}$/.test(value);
}

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
            localStorage.removeItem("loggedInUser");
            window.location.replace("dangnhap.html");
        });
    }

    const currentPage = window.location.pathname.split("/").pop() || "trangchu.html";
    document.querySelectorAll(".nav-links a").forEach(function (link) {
        link.classList.toggle("active", link.getAttribute("href") === currentPage);
    });

    ensureTemplateUser();
    updateNavbar();
});