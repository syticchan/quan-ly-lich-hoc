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

/* ===================== Người dùng ===================== */

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

/* ===================== Validate =====================
   Mỗi hàm trả về chuỗi lỗi cụ thể, hoặc "" nếu hợp lệ. */

function normalizeName(value) {
    return String(value).normalize("NFC").trim().replace(/\s+/g, " ");
}

function validateName(value) {
    const name = normalizeName(value);

    if (!name) return "Vui lòng nhập họ và tên";
    if (/\d/.test(name)) return "Họ và tên không được chứa chữ số";
    if (/[^\p{L}\s]/u.test(name)) return "Họ và tên chỉ được chứa chữ cái và khoảng trắng (không có ký tự đặc biệt)";
    if (!/^\p{Lu}\p{L}*(\s\p{Lu}\p{L}*)*$/u.test(name)) return "Chữ cái đầu của mỗi từ trong họ và tên phải viết hoa";
    return "";
}

function validateEmail(value) {
    const email = String(value).trim();

    if (!email) return "Vui lòng nhập email";
    if (/\s/.test(email)) return "Email không được chứa khoảng trắng";

    const parts = email.split("@");
    if (parts.length === 1) return "Email thiếu ký tự @";
    if (parts.length > 2) return "Email chỉ được chứa một ký tự @";

    const local = parts[0];
    const domain = parts[1];

    if (!local) return "Email thiếu phần tên trước ký tự @";
    if (!domain) return "Email thiếu phần tên miền sau ký tự @";
    if (!domain.includes(".")) return "Tên miền email phải có dạng như gmail.com";
    if (email.includes("..") || local.startsWith(".") || local.endsWith(".") ||
        domain.startsWith(".") || domain.endsWith(".")) {
        return "Email có dấu chấm đặt sai vị trí";
    }
    if (!/^[A-Za-z0-9._%+-]+$/.test(local)) return "Phần trước ký tự @ chứa ký tự không hợp lệ";
    if (!/^[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/.test(domain)) return "Tên miền email không hợp lệ";
    return "";
}

function validateStudentId(value) {
    const id = String(value).trim();

    if (!id) return "Vui lòng nhập mã sinh viên";
    if (!/^\d+$/.test(id)) return "Mã sinh viên chỉ được chứa chữ số";
    if (id.length !== 9) return "Mã sinh viên phải đủ 9 chữ số (hiện có " + id.length + " chữ số)";
    return "";
}

function validatePassword(value) {
    if (!value) return "Vui lòng nhập mật khẩu";
    if (/\s/.test(value)) return "Mật khẩu không được chứa khoảng trắng";

    const missing = [];
    if (value.length < 8) missing.push("đủ 8 ký tự (hiện có " + value.length + ")");
    if (!/[a-z]/.test(value)) missing.push("chữ thường (a-z)");
    if (!/[A-Z]/.test(value)) missing.push("chữ hoa (A-Z)");
    if (!/\d/.test(value)) missing.push("chữ số (0-9)");

    return missing.length ? "Mật khẩu còn thiếu: " + missing.join(", ") : "";
}

/* ===================== Phiên đăng nhập ===================== */

function isAuthenticated() {
    return localStorage.getItem("isLoggedIn") === "true" && !!getCurrentUser();
}

function clearSession() {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("loggedInUser");
}

const CURRENT_PAGE = window.location.pathname.split("/").pop() || "trangchu.html";

// Guard chạy ngay khi nạp main.js (trước các file js của từng trang)
(function guardPage() {
    ensureTemplateUser();

    if (!isAuthenticated()) clearSession();

    if (CURRENT_PAGE === "trangchu.html") return;

    if (CURRENT_PAGE === "dangnhap.html") {
        if (isAuthenticated()) window.location.replace("trangchu.html");
        return;
    }

    if (!isAuthenticated()) window.location.replace("dangnhap.html");
})();

/* ===================== Tiện ích dùng chung ===================== */

const pad = n => String(n).padStart(2, "0");

const esc = s => String(s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const toISO = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseISO = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

// Dữ liệu riêng cho từng tài khoản
const userKey = base => `${base}_${localStorage.getItem("loggedInUser") || "guest"}`;

function loadList(key) {
    try {
        const list = JSON.parse(localStorage.getItem(key));
        return Array.isArray(list) ? list : [];
    } catch (e) {
        return [];
    }
}

const openModal = m => { m.hidden = false; };
const closeModal = m => { if (m) m.hidden = true; };

// fields: { tênTrường: phầnTửInput }, errs: { tênTrường: "thông báo lỗi" }
function showFormErrors(form, fields, errs = {}) {
    Object.keys(fields).forEach(key => {
        const errEl = form.querySelector(`[data-err="${key}"]`);
        if (errEl) errEl.textContent = errs[key] || "";
        fields[key].classList.toggle("invalid", !!errs[key]);
    });
}

function initModals() {
    const modals = document.querySelectorAll(".modal");

    modals.forEach(m => {
        m.addEventListener("mousedown", e => { if (e.target === m) closeModal(m); });
        m.querySelectorAll("[data-close]").forEach(b => b.addEventListener("click", () => closeModal(m)));
    });

    document.addEventListener("keydown", e => {
        if (e.key === "Escape") modals.forEach(m => closeModal(m));
    });
}

/* ===================== Thanh điều hướng ===================== */

document.addEventListener("DOMContentLoaded", function () {
    const loginBtn = document.getElementById("loginBtn");
    const logoutBtn = document.getElementById("logoutBtn");

    if (loginBtn) loginBtn.hidden = isAuthenticated();
    if (logoutBtn) {
        logoutBtn.hidden = !isAuthenticated();
        logoutBtn.addEventListener("click", function () {
            clearSession();
            window.location.replace("dangnhap.html");
        });
    }

    document.querySelectorAll(".nav-links a").forEach(function (link) {
        link.classList.toggle("active", link.getAttribute("href") === CURRENT_PAGE);
    });

    initModals();
});