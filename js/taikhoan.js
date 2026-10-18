const modals = document.querySelectorAll(".modal-overlay");
const toast = document.getElementById("toast");

// Hiển thị thông báo
function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2800);
}

// Mở modal
function openModal(id) {
    const modal = document.getElementById(id);

    if (!modal) return;

    modal.classList.add("show");

    const input = modal.querySelector("input");

    if (input) {
        input.focus();
    }
}

// Đóng modal
function closeModal(modal) {
    if (modal) {
        modal.classList.remove("show");
    }
}

// Mở modal khi nhấn mục cài đặt
document.querySelectorAll("[data-modal]").forEach(button => {
    button.addEventListener("click", () => {
        openModal(button.dataset.modal);
    });
});

// Đóng modal bằng nút X hoặc nút Hủy
document.querySelectorAll(".close-btn, [data-close]")
    .forEach(button => {
        button.addEventListener("click", () => {
            closeModal(button.closest(".modal-overlay"));
        });
    });

// Đóng modal khi nhấn bên ngoài
modals.forEach(modal => {
    modal.addEventListener("click", event => {
        if (event.target === modal) {
            closeModal(modal);
        }
    });
});

// Đóng bằng phím Escape
document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        modals.forEach(modal => closeModal(modal));
    }
});

// Cập nhật thông tin cá nhân trên giao diện
document.getElementById("editForm")
    .addEventListener("submit", event => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);

        const fields = [
            "name",
            "email",
            "school",
            "faculty",
            "className"
        ];

        fields.forEach(key => {
            const value = String(formData.get(key) || "").trim();

            const target = document.querySelector(
                `[data-field="${key}"]`
            );

            if (target && value) {
                target.textContent = value;
            }
        });

        closeModal(document.getElementById("editModal"));

        showToast("Đã cập nhật thông tin trên giao diện.");
    });

// Kiểm tra thông tin đổi mật khẩu
document.getElementById("passwordForm")
    .addEventListener("submit", event => {
        event.preventDefault();

        const currentPassword =
            document.getElementById("currentPassword").value;

        const newPassword =
            document.getElementById("newPassword").value;

        const confirmPassword =
            document.getElementById("confirmPassword").value;

        if (!currentPassword) {
            showToast("Vui lòng nhập mật khẩu hiện tại.");
            return;
        }

        if (newPassword.length < 8) {
            showToast("Mật khẩu mới cần ít nhất 8 ký tự.");
            return;
        }

        if (newPassword !== confirmPassword) {
            showToast("Mật khẩu xác nhận chưa khớp.");

            document.getElementById("confirmPassword").focus();
            return;
        }

        closeModal(document.getElementById("passwordModal"));

        event.currentTarget.reset();

        showToast(
            "Đây là giao diện mẫu. Cần backend để đổi mật khẩu thật."
        );
    });

