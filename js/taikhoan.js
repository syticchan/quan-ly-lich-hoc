const toast = document.getElementById("toast");
const editForm = document.getElementById("editForm");
const passwordForm = document.getElementById("passwordForm");

const profileFields = [
    "name",
    "studentId",
    "email",
    "school",
    "faculty",
    "className"
];

// Hiển thị thông tin người dùng hiện tại
function renderProfile() {
    const user = getCurrentUser();

    if (!user) return;

    profileFields.forEach(key => {
        const target = document.querySelector(`[data-field="${key}"]`);

        if (target) {
            target.textContent = user[key] || EMPTY_VALUE;
        }
    });
}

// Hiển thị thông báo
function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2800);
}

function setError(inputId, message) {
    const input = document.getElementById(inputId);

    input.classList.add("invalid");
    input.parentElement.querySelector(".err").textContent = message;
}

function clearErrors(form) {
    form.querySelectorAll(".err").forEach(error => {
        error.textContent = "";
    });

    form.querySelectorAll(".invalid").forEach(input => {
        input.classList.remove("invalid");
    });
}

function fillEditForm(user) {
    document.getElementById("editName").value = user.name;
    document.getElementById("editEmail").value = user.email;

    document.getElementById("editSchool").value =
        user.school === EMPTY_VALUE ? "" : user.school;

    document.getElementById("editFaculty").value =
        user.faculty === EMPTY_VALUE ? "" : user.faculty;

    document.getElementById("editClass").value =
        user.className === EMPTY_VALUE ? "" : user.className;
}

// Mở modal cài đặt (đóng modal do main.js xử lý: nút X, Hủy, nhấn nền, Escape)
function openSettingModal(id) {
    const modal = document.getElementById(id);
    const user = getCurrentUser();

    if (!modal || !user) return;

    const form = modal.querySelector("form");

    clearErrors(form);

    if (id === "editModal") {
        fillEditForm(user);
    } else {
        form.reset();
    }

    openModal(modal);

    const input = modal.querySelector("input");

    if (input) {
        input.focus();
    }
}

document.querySelectorAll("[data-modal]").forEach(button => {
    button.addEventListener("click", () => {
        openSettingModal(button.dataset.modal);
    });
});

// Cập nhật thông tin cá nhân
editForm.addEventListener("submit", event => {
    event.preventDefault();

    const user = getCurrentUser();

    if (!user) return;

    clearErrors(editForm);

    const formData = new FormData(event.currentTarget);
    const values = {};

    profileFields.forEach(key => {
        values[key] = String(formData.get(key) || "").trim();
    });

    values.name = normalizeName(values.name);
    values.email = values.email.toLowerCase();

    const users = getUsers();

    let isValid = true;

    const nameError = validateName(values.name);
    if (nameError) {
        setError("editName", nameError);
        isValid = false;
    }

    const emailError = validateEmail(values.email);
    if (emailError) {
        setError("editEmail", emailError);
        isValid = false;
    } else if (users.some(item =>
        item.studentId !== user.studentId &&
        item.email.toLowerCase() === values.email
    )) {
        setError("editEmail", "Email này đã được tài khoản khác sử dụng");
        isValid = false;
    }

    if (!isValid) return;

    const index = users.findIndex(item => item.studentId === user.studentId);

    users[index] = Object.assign({}, users[index], {
        name: values.name,
        email: values.email,
        school: values.school || EMPTY_VALUE,
        faculty: values.faculty || EMPTY_VALUE,
        className: values.className || EMPTY_VALUE
    });

    saveUsers(users);
    renderProfile();

    closeModal(document.getElementById("editModal"));

    showToast("Đã cập nhật thông tin thành công");
});

// Đổi mật khẩu
passwordForm.addEventListener("submit", event => {
    event.preventDefault();

    const user = getCurrentUser();

    if (!user) return;

    clearErrors(passwordForm);

    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    let isValid = true;

    if (currentPassword === "") {
        setError("currentPassword", "Vui lòng nhập mật khẩu hiện tại");
        isValid = false;
    } else if (currentPassword !== user.password) {
        setError("currentPassword", "Mật khẩu hiện tại không đúng");
        isValid = false;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
        setError("newPassword", passwordError);
        isValid = false;
    } else if (newPassword === user.password) {
        setError("newPassword", "Mật khẩu mới phải khác mật khẩu hiện tại");
        isValid = false;
    }

    if (confirmPassword === "") {
        setError("confirmPassword", "Vui lòng xác nhận lại mật khẩu mới");
        isValid = false;
    } else if (confirmPassword !== newPassword) {
        setError("confirmPassword", "Mật khẩu xác nhận không trùng khớp");
        isValid = false;
    }

    if (!isValid) return;

    const users = getUsers();
    const index = users.findIndex(item => item.studentId === user.studentId);

    users[index].password = newPassword;

    saveUsers(users);

    closeModal(document.getElementById("passwordModal"));

    event.currentTarget.reset();

    showToast("Đổi mật khẩu thành công");
});

renderProfile();