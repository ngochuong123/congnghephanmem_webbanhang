const express = require('express');
const cors = require('cors');
const mysql = require('mysql2'); // 1. Thêm thư viện kết nối MySQL

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// 2. CẤU HÌNH KẾT NỐI DATABASE (Hùng điền mật khẩu vào đây)
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '12345', // <-- ĐIỀN MẬT KHẨU WORKBENCH CỦA HÙNG VÀO ĐÂY
    database: 'gamestore_db'       // Tên Schema Hùng vừa tạo ở Workbench
});

// Kiểm tra kết nối
db.connect((err) => {
    if (err) {
        console.error('Lỗi kết nối MySQL rồi Hùng ơi! Check lại pass nhé:', err.message);
        return;
    }
    console.log('>>> ĐÃ KẾT NỐI THÀNH CÔNG VỚI MYSQL WORKBENCH! +))');
});

app.get('/', (req, res) => {
    res.send("<h1>Server GameStore + MySQL đã sẵn sàng!</h1>");
});

// 3. API NHẬN ĐƠN HÀNG VÀ LƯU VÀO DATABASE
app.post('/api/checkout', (req, res) => {
    const data = req.body;
    console.log(">>> NHẬN ĐƠN HÀNG MỚI:", data);

    // Câu lệnh SQL để chèn dữ liệu vào bảng orders
    const sql = `INSERT INTO orders (customerName, phone, address, totalAmount, paymentMethod) 
                 VALUES (?, ?, ?, ?, ?)`;

    const values = [
        data.name,
        data.phone,
        data.address,
        data.total,
        data.method
    ];

    // Thực hiện lưu vào database
    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Lỗi khi lưu vào MySQL:", err);
            return res.status(500).json({ success: false, message: "Lỗi lưu Database!" });
        }

        console.log(">>> ĐÃ LƯU ĐƠN HÀNG VÀO DATABASE THÀNH CÔNG! ID:", result.insertId);

        // Phản hồi lại cho Frontend
        res.json({
            success: true,
            message: "Đơn hàng của " + data.name + " đã được lưu vào Database!",
            orderID: result.insertId
        });
    });
});
// 1. API ĐĂNG KÝ (Register)
app.post('/api/register', (req, res) => {
    const { username, email, password } = req.body;

    const sql = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
    db.query(sql, [username, email, password], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.json({ success: false, message: "Tên đăng nhập hoặc Email đã tồn tại!" });
            }
            return res.status(500).json({ success: false, message: "Lỗi hệ thống!" });
        }
        res.json({ success: true, message: "Đăng ký thành viên thành công! +))" });
    });
});

// 2. API ĐĂNG NHẬP (Login)
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    const sql = "SELECT * FROM users WHERE email = ? AND password = ?";
    db.query(sql, [email, password], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: "Lỗi hệ thống!" });

        if (results.length > 0) {
            // LẤY USERNAME TỪ KẾT QUẢ DATABASE TRẢ VỀ (results[0])
            const loggedInUser = results[0];

            res.json({
                success: true,
                message: "Chào mừng " + loggedInUser.username + " quay trở lại!",
                user: {
                    id: loggedInUser.id,
                    username: loggedInUser.username,
                    email: loggedInUser.email
                }
            });
        } else {
            res.json({ success: false, message: "Sai Email hoặc mật khẩu rồi Hùng ơi!" });
        }
    });
});

// API LẤY DANH SÁCH SẢN PHẨM
app.get('/api/products', (req, res) => {
    const sql = "SELECT * FROM products";

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Lỗi lấy sản phẩm:", err);
            return res.status(500).json({ success: false, message: "Lỗi Database!" });
        }
        res.json(results); // Trả về mảng sản phẩm cho Frontend
    });
});
let paymentStatus = {}; // Biến tạm lưu trạng thái thanh toán

app.get('/api/check-payment', (req, res) => {
    const name = req.query.name;
    if (paymentStatus[name]) {
        res.json({ paid: true });
        delete paymentStatus[name]; // Xóa sau khi dùng xong
    } else {
        res.json({ paid: false });
    }
});

// Hùng dùng Postman gọi vào đây để giả lập tiền về:
app.post('/api/fake-ting-ting', (req, res) => {
    const { name } = req.body;
    paymentStatus[name] = true;
    res.send("Đã giả lập nhận tiền thành công!");
});

app.listen(PORT, () => {
    console.log(`\n=========================================`);
    console.log(`SERVER ĐANG CHẠY TẠI: http://localhost:${PORT}`);
    console.log(`=========================================`);
});