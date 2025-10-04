// Login.js - Xử lý đăng nhập và chuyển hướng

// Kiểm tra authentication khi trang load
document.addEventListener("DOMContentLoaded", function () {
  // Nếu đã đăng nhập, chuyển thẳng đến viewer
  const isLoggedIn = sessionStorage.getItem("isLoggedIn");
  if (isLoggedIn === "true") {
    redirectToViewer();
    return;
  }

  // Initialize login form
  initializeLoginForm();
});

// Khởi tạo form đăng nhập
function initializeLoginForm() {
  const loginForm = document.getElementById("loginForm");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const loginBtn = document.getElementById("loginBtn");
  const loginBtnText = document.getElementById("loginBtnText");
  const errorMessage = document.getElementById("errorMessage");
  const loadingMessage = document.getElementById("loadingMessage");

  // Xử lý submit form
  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    handleLogin();
  });

  // Xử lý Enter key
  document.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !loginBtn.disabled) {
      e.preventDefault();
      handleLogin();
    }
  });

  // Ẩn error message khi user bắt đầu nhập
  usernameInput.addEventListener("input", hideMessages);
  passwordInput.addEventListener("input", hideMessages);

  // Xử lý đăng nhập
  function handleLogin() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    // Validation
    if (!username || !password) {
      showError("Vui lòng nhập đầy đủ thông tin đăng nhập");
      return;
    }

    // Hiển thị loading state
    showLoading();

    // Simulate API call delay (có thể bỏ trong production)
    setTimeout(() => {
      // Simple authentication (trong thực tế nên dùng API)
      if (username === "avis.vo" && password === "Danh&vong") {
        // Đăng nhập thành công
        sessionStorage.setItem("isLoggedIn", "true");
        sessionStorage.setItem("username", username);
        sessionStorage.setItem("loginTime", new Date().toISOString());

        showSuccess();

        // Chuyển đến viewer sau delay ngắn
        setTimeout(() => {
          redirectToViewer();
        }, 1000);
      } else {
        // Đăng nhập thất bại
        hideLoading();
        showError("Tên đăng nhập hoặc mật khẩu không chính xác");
        passwordInput.value = "";
        passwordInput.focus();

        // Thêm shake animation
        const form = document.querySelector(".bg-slate-800\\/50");
        form.classList.add("animate-pulse");
        setTimeout(() => {
          form.classList.remove("animate-pulse");
        }, 500);
      }
    }, 1500); // Simulate network delay
  }

  // Hiển thị loading state
  function showLoading() {
    hideMessages();
    loadingMessage.classList.remove("hidden");
    loginBtn.disabled = true;
    loginBtnText.textContent = "Đang đăng nhập...";

    // Disable inputs
    usernameInput.disabled = true;
    passwordInput.disabled = true;
  }

  // Ẩn loading state
  function hideLoading() {
    loadingMessage.classList.add("hidden");
    loginBtn.disabled = false;
    loginBtnText.textContent = "Đăng nhập";

    // Enable inputs
    usernameInput.disabled = false;
    passwordInput.disabled = false;
  }

  // Hiển thị success message
  function showSuccess() {
    hideMessages();
    loadingMessage.classList.remove("hidden");
    loadingMessage.className =
      "bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-lg text-sm";
    loadingMessage.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-check-circle mr-2"></i>
                <span>Đăng nhập thành công! Đang chuyển hướng...</span>
            </div>
        `;
    loginBtnText.textContent = "Thành công!";
  }

  // Hiển thị error message
  function showError(message) {
    hideMessages();
    errorMessage.classList.remove("hidden");
    document.getElementById("errorText").textContent = message;
  }

  // Ẩn tất cả messages
  function hideMessages() {
    errorMessage.classList.add("hidden");
    loadingMessage.classList.add("hidden");
    loadingMessage.className =
      "hidden bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-3 rounded-lg text-sm";
    loadingMessage.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-spinner fa-spin mr-2"></i>
                <span>Đang đăng nhập...</span>
            </div>
        `;
  }
}

// Chuyển hướng đến viewer
function redirectToViewer() {
  // Thêm fade out effect
  document.body.style.opacity = "0";
  document.body.style.transition = "opacity 0.3s ease-out";

  setTimeout(() => {
    window.location.href = "./viewer.html";
  }, 300);
}

// Utility functions
function getCurrentUser() {
  return sessionStorage.getItem("username");
}

function getLoginTime() {
  return sessionStorage.getItem("loginTime");
}

function isAuthenticated() {
  return sessionStorage.getItem("isLoggedIn") === "true";
}

function logout() {
  sessionStorage.removeItem("isLoggedIn");
  sessionStorage.removeItem("username");
  sessionStorage.removeItem("loginTime");
  window.location.href = "./index.html";
}
