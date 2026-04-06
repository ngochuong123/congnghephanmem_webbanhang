document.getElementById('registerForm').addEventListener('submit', function (e) {
    // 1. Chặn trang web load lại (vì chúng ta đang xử lý bằng JS)
    e.preventDefault();

    // 2. Lấy dữ liệu từ các ô nhập
    const fullname = document.getElementById('fullname').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // 3. Kiểm tra logic (Validation)
    // Kiểm tra mật khẩu khớp nhau
    if (password !== confirmPassword) {
        alert("Mật khẩu xác nhận không khớp! Vui lòng kiểm tra lại.");
        return; // Dừng xử lý tiếp
    }

    // 4. Giả lập lưu trữ vào LocalStorage (Database tạm thời trên trình duyệt)
    // Tạo một đối tượng người dùng mới
    const newUser = {
        fullname: fullname,
        email: email,
        password: password // Lưu ý: Thực tế không bao giờ lưu mật khẩu thô như này, nhưng bài tập thì OK.
    };

    // Kiểm tra xem email này đã có ai đăng ký chưa
    let users = JSON.parse(localStorage.getItem('users')) || [];
    const isExisted = users.find(user => user.email === email);

    if (isExisted) {
        alert("Email này đã được đăng ký! Hãy thử email khác.");
    } else {
        // Thêm người dùng mới vào danh sách
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));

        alert("Đăng ký thành công! Bạn sẽ được chuyển đến trang Đăng nhập.");

        // 5. Chuyển hướng sang trang đăng nhập (sau khi bạn tạo file login.html)
        window.location.href = 'login.html';
    }
});