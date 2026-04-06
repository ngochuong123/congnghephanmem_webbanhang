document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    // 1. Lấy dữ liệu từ Form
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    // 2. GỬI YÊU CẦU ĐĂNG NHẬP SANG BACKEND
    try {
        const response = await fetch('http://localhost:5000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, password: password })
        });

        const result = await response.json();

        if (result.success) {
            // 3. Lưu thông tin người dùng hiện tại (bao gồm cả id, username, email và ROLE)
            localStorage.setItem('currentUser', JSON.stringify(result.user));

            // LƯU RIÊNG ROLE ĐỂ CÁC TRANG KHÁC DỄ KIỂM TRA
            localStorage.setItem('userRole', result.user.role);

            alert(result.message);

            // 4. ĐIỀU HƯỚNG THÔNG MINH DỰA TRÊN ROLE
            if (result.user.role === 'admin') {
                // Nếu là Admin thì bay vào trang quản trị
                window.location.href = 'admin.html';
            } else {
                // Nếu là khách thường thì về trang chủ mua game
                window.location.href = 'index.html';
            }

        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error("Lỗi kết nối:", error);
        alert("Server đang bận hoặc chưa bật rồi Hùng ơi! +))");
    }
});