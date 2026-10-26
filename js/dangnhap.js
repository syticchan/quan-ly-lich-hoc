document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const headingTitle = document.getElementById("headingTitle");
  const headingText = document.getElementById("headingText");

  const loginId = document.getElementById("loginId");
  const loginPassword = document.getElementById("loginPassword");
  const rememberMe = document.getElementById("rememberMe");
  const loginIdError = document.getElementById("loginIdError");
  const loginPasswordError = document.getElementById("loginPasswordError");
  const loginMessage = document.getElementById("loginMessage");
  const forgotPassword = document.getElementById("forgotPassword");

  const regName = document.getElementById("regName");
  const regEmail = document.getElementById("regEmail");
  const regStudentId = document.getElementById("regStudentId");
  const regPassword = document.getElementById("regPassword");
  const regConfirm = document.getElementById("regConfirm");
  const regNameError = document.getElementById("regNameError");
  const regEmailError = document.getElementById("regEmailError");
  const regStudentIdError = document.getElementById("regStudentIdError");
  const regPasswordError = document.getElementById("regPasswordError");
  const regConfirmError = document.getElementById("regConfirmError");
  const registerMessage = document.getElementById("registerMessage");

  // Hiện hoặc ẩn mật khẩu
  document.querySelectorAll(".toggle-password").forEach(function (button) {
    const input = document.getElementById(button.dataset.target);

    button.addEventListener("click", function () {
      const isPasswordHidden = input.type === "password";

      input.type = isPasswordHidden ? "text" : "password";

      button.innerHTML = isPasswordHidden
        ? '<i class="fa-solid fa-eye-slash"></i>'
        : '<i class="fa-solid fa-eye"></i>';

      button.setAttribute(
        "aria-label",
        isPasswordHidden ? "Ẩn mật khẩu" : "Hiện mật khẩu"
      );
    });
  });

  // Tải email/mã sinh viên đã ghi nhớ
  try {
    const savedLogin = localStorage.getItem("rememberedLogin");

    if (savedLogin) {
      loginId.value = savedLogin;
      rememberMe.checked = true;
    }
  } catch (error) {
    console.warn("Không thể đọc thông tin đã ghi nhớ");
  }

  function showMessage(element, message, type) {
    element.textContent = message;
    element.className = "form-message " + type;
  }

  function clearMessages(form) {
    form.querySelectorAll(".error-message").forEach(function (error) {
      error.textContent = "";
    });

    const message = form.querySelector(".form-message");

    message.textContent = "";
    message.className = "form-message";
  }

  function switchForm(mode) {
    const isLogin = mode === "login";

    loginForm.hidden = !isLogin;
    registerForm.hidden = isLogin;

    headingTitle.textContent = isLogin
      ? "Chào mừng trở lại!"
      : "Tạo tài khoản mới";

    headingText.textContent = isLogin
      ? "Đăng nhập vào tài khoản của bạn"
      : "Điền thông tin để đăng ký";

    clearMessages(loginForm);
    clearMessages(registerForm);
  }

  document.getElementById("showRegister").addEventListener("click", function () {
    switchForm("register");
    regName.focus();
  });

  document.getElementById("showLogin").addEventListener("click", function () {
    switchForm("login");
    loginId.focus();
  });

  // Xóa lỗi khi người dùng nhập lại
  document.querySelectorAll("form input").forEach(function (input) {
    input.addEventListener("input", function () {
      const group = input.closest(".form-group");
      const error = group && group.querySelector(".error-message");

      if (error) {
        error.textContent = "";
      }

      const message = input.closest("form").querySelector(".form-message");

      message.textContent = "";
      message.className = "form-message";
    });
  });

  // Xử lý đăng nhập
  loginForm.addEventListener("submit", function (event) {
    event.preventDefault();

    clearMessages(loginForm);

    const identifier = loginId.value.trim();
    const password = loginPassword.value;
    const isEmail = identifier.includes("@");

    let isValid = true;

    // Kiểm tra email hoặc mã sinh viên
    if (identifier === "") {
      loginIdError.textContent = "Vui lòng nhập email hoặc mã sinh viên";
      isValid = false;
    } else if (isEmail) {
      const emailError = validateEmail(identifier);
      if (emailError) {
        loginIdError.textContent = emailError;
        isValid = false;
      }
    } else if (/^\d+$/.test(identifier)) {
      const idError = validateStudentId(identifier);
      if (idError) {
        loginIdError.textContent = idError;
        isValid = false;
      }
    } else {
      loginIdError.textContent =
        "Nhập email (có ký tự @) hoặc mã sinh viên gồm 9 chữ số";
      isValid = false;
    }

    // Kiểm tra mật khẩu
    if (password === "") {
      loginPasswordError.textContent = "Vui lòng nhập mật khẩu";
      isValid = false;
    }

    if (!isValid) {
      return;
    }

    const account = getUsers().find(function (item) {
      return isEmail
        ? item.email.toLowerCase() === identifier.toLowerCase()
        : item.studentId === identifier;
    });

    if (!account || account.password !== password) {
      loginPasswordError.textContent =
        "Email/mã sinh viên hoặc mật khẩu không đúng";
      return;
    }

    try {
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("loggedInUser", account.studentId);

      if (rememberMe.checked) {
        localStorage.setItem("rememberedLogin", identifier);
      } else {
        localStorage.removeItem("rememberedLogin");
      }
    } catch (error) {
      console.warn("Không thể lưu trạng thái đăng nhập");
    }

    showMessage(
      loginMessage,
      "Đăng nhập thành công! Đang chuyển trang...",
      "success"
    );

    window.setTimeout(function () {
      window.location.href = "trangchu.html";
    }, 700);
  });

  // Xử lý đăng ký
  registerForm.addEventListener("submit", function (event) {
    event.preventDefault();

    clearMessages(registerForm);

    const name = normalizeName(regName.value);
    const email = regEmail.value.trim().toLowerCase();
    const studentId = regStudentId.value.trim();
    const password = regPassword.value;
    const confirmPassword = regConfirm.value;
    const users = getUsers();

    let isValid = true;

    const nameError = validateName(name);
    if (nameError) {
      regNameError.textContent = nameError;
      isValid = false;
    }

    const emailError = validateEmail(email);
    if (emailError) {
      regEmailError.textContent = emailError;
      isValid = false;
    } else if (users.some(function (user) {
      return user.email.toLowerCase() === email;
    })) {
      regEmailError.textContent = "Email này đã được đăng ký";
      isValid = false;
    }

    const idError = validateStudentId(studentId);
    if (idError) {
      regStudentIdError.textContent = idError;
      isValid = false;
    } else if (users.some(function (user) {
      return user.studentId === studentId;
    })) {
      regStudentIdError.textContent = "Mã sinh viên này đã được đăng ký";
      isValid = false;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      regPasswordError.textContent = passwordError;
      isValid = false;
    }

    if (confirmPassword === "") {
      regConfirmError.textContent = "Vui lòng xác nhận lại mật khẩu";
      isValid = false;
    } else if (confirmPassword !== password) {
      regConfirmError.textContent = "Mật khẩu xác nhận không trùng khớp";
      isValid = false;
    }

    if (!isValid) {
      return;
    }

    users.push({
      name: name,
      studentId: studentId,
      email: email,
      school: EMPTY_VALUE,
      faculty: EMPTY_VALUE,
      className: EMPTY_VALUE,
      password: password
    });

    try {
      saveUsers(users);
    } catch (error) {
      showMessage(
        registerMessage,
        "Không thể lưu tài khoản. Vui lòng thử lại",
        "error"
      );
      return;
    }

    registerForm.reset();
    switchForm("login");

    loginId.value = email;
    loginPassword.value = "";
    loginPassword.focus();

    showMessage(
      loginMessage,
      "Đăng ký thành công! Vui lòng đăng nhập",
      "success"
    );
  });

  // Nút quên mật khẩu
  forgotPassword.addEventListener("click", function () {
    showMessage(
      loginMessage,
      "Vui lòng liên hệ quản trị viên để đặt lại mật khẩu",
      "error"
    );
  });
});