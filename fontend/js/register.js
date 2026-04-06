document.getElementById('registerForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    // 1. Lấy dữ liệu
    const fullname = document.getElementById('fullname').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // 2. Kiểm tra logic nhanh
    if (password !== confirmPassword) {
        alert("Mật khẩu xác nhận không khớp!");
        return;
    }

    // 3. GỬI DỮ LIỆU SANG BACKEND (Thay thế LocalStorage)
    try {
        const response = await fetch('https://ndtc.onrender.com/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: fullname, // Map với cột username trong DB của Hùng
                email: email,
                password: password
            })
        });

        const result = await response.json();

        if (result.success) {
            alert(result.message);
            window.location.href = 'login.html';
        } else {
            alert("Lỗi: " + result.message);
        }
    } catch (error) {
        console.error("Lỗi kết nối:", error);
        alert("Không kết nối được với Server Backend!");
    }
});