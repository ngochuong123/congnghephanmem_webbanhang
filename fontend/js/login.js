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
            // Lưu ý: Nếu Backend của Hùng dùng username để check thì đổi email thành username nhé
            body: JSON.stringify({ email: email, password: password })
        });

        const result = await response.json();

        if (result.success) {
            // 3. Lưu thông tin người dùng hiện tại (để hiện tên lên Header)
            localStorage.setItem('currentUser', JSON.stringify(result.user));
            alert(result.message);
            // 4. Chuyển hướng về trang chủ
            window.location.href = 'index.html';
        } else {
            alert(result.message); // Hiện lỗi "Sai mật khẩu" hoặc "Không tồn tại" từ Server
        }
    } catch (error) {
        console.error("Lỗi kết nối:", error);
        alert("Server đang bận hoặc chưa bật rồi bạn ơi! +))");
    }
});