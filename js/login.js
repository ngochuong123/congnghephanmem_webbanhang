document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    // 1. Lấy danh sách người dùng từ LocalStorage
    const users = JSON.parse(localStorage.getItem('users')) || [];

    // 2. Tìm kiếm người dùng có email khớp
    const user = users.find(u => u.email === email);

    if (!user) {
        alert("Email này chưa được đăng ký!");
        return;
    }

    // 3. Kiểm tra mật khẩu
    if (user.password === password) {
        alert("Đăng nhập thành công! Chào mừng " + user.fullname);

        // Lưu trạng thái đã đăng nhập của người dùng hiện tại
        localStorage.setItem('currentUser', JSON.stringify(user));

        // 4. Chuyển hướng về trang chủ (index.html)
        window.location.href = 'index.html';
    } else {
        alert("Mật khẩu không chính xác!");
    }
});