document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const rememberMe = document.getElementById("rememberMe");
  const togglePassword = document.getElementById("togglePassword");

  const emailError = document.getElementById("emailError");
  const passwordError = document.getElementById("passwordError");
  const formMessage = document.getElementById("formMessage");
  const forgotPassword = document.getElementById("forgotPassword");

  // Hiện hoặc ẩn mật khẩu
  togglePassword.addEventListener("click", function () {
    const isPasswordHidden = passwordInput.type === "password";

    passwordInput.type = isPasswordHidden ? "text" : "password";

    togglePassword.innerHTML = isPasswordHidden
      ? '<i class="fa-solid fa-eye-slash"></i>'
      : '<i class="fa-solid fa-eye"></i>';

    togglePassword.setAttribute(
      "aria-label",
      isPasswordHidden ? "Ẩn mật khẩu" : "Hiện mật khẩu"
    );
  });

  // Tải email đã ghi nhớ
  try {
    const savedEmail = localStorage.getItem("rememberedLoginEmail");

    if (savedEmail) {
      emailInput.value = savedEmail;
      rememberMe.checked = true;
    }
  } catch (error) {
    console.warn("Không thể đọc email đã ghi nhớ.");
  }

  // Hàm hiển thị thông báo
  function showMessage(message, type) {
    formMessage.textContent = message;
    formMessage.className = "form-message " + type;
  }

  // Xóa lỗi khi người dùng nhập lại
  emailInput.addEventListener("input", function () {
    emailError.textContent = "";
    formMessage.textContent = "";
    formMessage.className = "form-message";
  });

  passwordInput.addEventListener("input", function () {
    passwordError.textContent = "";
    formMessage.textContent = "";
    formMessage.className = "form-message";
  });

  // Xử lý đăng nhập
  loginForm.addEventListener("submit", function (event) {
    event.preventDefault();

    emailError.textContent = "";
    passwordError.textContent = "";
    formMessage.textContent = "";
    formMessage.className = "form-message";

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    let isValid = true;

    // Kiểm tra email
    if (email === "") {
      emailError.textContent =
        "Vui lòng nhập mã sinh viên hoặc email.";

      isValid = false;
    }

    // Kiểm tra mật khẩu
    if (password === "") {
      passwordError.textContent =
        "Vui lòng nhập mật khẩu.";

      isValid = false;
    }

    if (!isValid) {
      return;
    }

    /*
      TÀI KHOẢN DEMO

      Email: sinhvien@univ.edu.vn
      Mật khẩu: 12345678

      Khi làm website thật, hãy thay phần kiểm tra này
      bằng API xác thực từ máy chủ.
    */

    if (
      email === "sinhvien@gmail.com" &&
      password === "12345678"
    ) {
      try {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("loggedInUser", email);

        if (rememberMe.checked) {
          localStorage.setItem("rememberedLoginEmail", email);
        } else {
          localStorage.removeItem("rememberedLoginEmail");
        }
      } catch (error) {
        console.warn("Không thể lưu trạng thái đăng nhập.");
      }

      showMessage(
        "Đăng nhập thành công! Đang chuyển trang...",
        "success"
      );

      // Chuyển đến trang chủ
      window.setTimeout(function () {
        window.location.href = "trangchu.html";
      }, 700);

    } else {
      showMessage(
        "Email hoặc mật khẩu không chính xác. Vui lòng thử lại.",
        "error"
      );
    }
  });

  // Nút quên mật khẩu
  forgotPassword.addEventListener("click", function () {
    showMessage(
      "Vui lòng liên hệ quản trị viên để đặt lại mật khẩu.",
      "error"
    );
  });
});
