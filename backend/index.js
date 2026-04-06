const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: '*', // Cho phép tất cả các nguồn truy cập (để đi thi cho chắc cú)
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// 1. CẤU HÌNH KẾT NỐI DATABASE
const db = mysql.createConnection({
    host: process.env.MYSQLHOST || 'localhost',
    user: process.env.MYSQLUSER || 'root',
    password: process.env.MYSQLPASSWORD || '12345',
    database: process.env.MYSQLDATABASE || 'gamestore_db',
    port: process.env.MYSQLPORT || 3306,
    connectTimeout: 10000 // Thêm dòng này (10 giây chờ)
});
// --- SỬA ĐOẠN NÀY ---
db.connect((err) => {
    if (err) {
        console.error('❌ LỖI KẾT NỐI DATABASE:', err.message);
        console.log('>>> SERVER VẪN CHẠY NHƯNG CHƯA CÓ DB. KIỂM TRA LẠI BIẾN MÔI TRƯỜNG!');
        // KHÔNG dùng return; ở đây để tránh sập Server
    } else {
        console.log('✅ DATABASE ĐÃ SẴN SÀNG! HỆ THỐNG GAMESTORE ĐÃ BẬT! +))');
    }
});

// Biến tạm lưu trạng thái thanh toán cho chức năng Ting Ting
let paymentStatus = {};

// ==========================================
// API DÀNH CHO KHÁCH HÀNG (USER)
// ==========================================

// Lấy sản phẩm cho trang chủ
app.get('/api/products', (req, res) => {
    db.query("SELECT * FROM products", (err, results) => {
        if (err) return res.status(500).json([]);
        res.json(results);
    });
});

// Đăng ký thành viên
app.post('/api/register', (req, res) => {
    const { username, email, password } = req.body;
    const sql = "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, 'user')";
    db.query(sql, [username, email, password], (err) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') return res.json({ success: false, message: "Email hoặc tên đăng nhập đã tồn tại!" });
            return res.status(500).json({ success: false, message: "Lỗi hệ thống!" });
        }
        res.json({ success: true, message: "Đăng ký thành công! +))" });
    });
});

// THANH TOÁN (Lưu đơn + Lưu chi tiết + TRỪ KHO NGAY LẬP TỨC)
app.post('/api/checkout', (req, res) => {
    const { name, phone, address, total, method, cartItems } = req.body;
    console.log(">>> NHẬN ĐƠN HÀNG MỚI TỪ:", name);

    const sqlOrder = `INSERT INTO orders (customerName, phone, address, totalAmount, paymentMethod) 
                      VALUES (?, ?, ?, ?, ?)`;

    db.query(sqlOrder, [name, phone, address, total, method], (err, result) => {
        if (err) {
            console.error("Lỗi lưu đơn hàng:", err);
            return res.status(500).json({ success: false });
        }

        const orderId = result.insertId;

        // Nếu có danh sách sản phẩm (cartItems), thực hiện lưu chi tiết và trừ kho
        if (cartItems && cartItems.length > 0) {
            cartItems.forEach(item => {
                // 1. Lưu vào bảng chi tiết (order_items) để Admin xem được đơn mua gì
                const sqlItems = "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)";
                db.query(sqlItems, [orderId, item.id, item.quantity, item.price]);

                // 2. Cập nhật số lượng tồn kho (TRỪ KHO)
                const sqlUpdateStock = "UPDATE products SET stock = stock - ? WHERE id = ?";
                db.query(sqlUpdateStock, [item.quantity, item.id], (err) => {
                    if (err) console.error("Lỗi trừ kho game ID " + item.id, err);
                });
            });
        }

        res.json({
            success: true,
            message: "Đặt hàng thành công và đã cập nhật kho!",
            orderID: orderId
        });
    });
});

// Kiểm tra trạng thái thanh toán (Dành cho trang chuyển khoản)
app.get('/api/check-payment', (req, res) => {
    const name = req.query.name;
    if (paymentStatus[name]) {
        res.json({ paid: true });
        delete paymentStatus[name];
    } else {
        res.json({ paid: false });
    }
});

// Giả lập nhận tiền (Ting Ting) từ Postman
app.post('/api/fake-ting-ting', (req, res) => {
    const { name } = req.body;
    paymentStatus[name] = true;
    console.log(`>>> ĐÃ NHẬN TIỀN TỪ: ${name}!`);
    res.send("Đã giả lập nhận tiền thành công!");
});

// ==========================================
// API DÀNH CHO ADMIN
// ==========================================

// Đăng nhập (Có trả về Role để Frontend điều hướng)
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const sql = "SELECT id, username, email, role FROM users WHERE email = ? AND password = ?";
    db.query(sql, [email, password], (err, results) => {
        if (err) return res.status(500).json({ success: false });

        if (results.length > 0) {
            res.json({
                success: true,
                message: `Chào sếp ${results[0].username}!`,
                user: results[0]
            });
        } else {
            res.json({ success: false, message: "Sai tài khoản hoặc mật khẩu rồi Hùng ơi!" });
        }
    });
});

// Danh sách đơn hàng
app.get('/api/admin/orders', (req, res) => {
    db.query("SELECT * FROM orders ORDER BY id DESC", (err, results) => {
        if (err) return res.json([]);
        res.json(results);
    });
});

// Chi tiết đơn hàng (Join 3 bảng)
app.get('/api/admin/order-detail/:id', (req, res) => {
    const orderId = req.params.id;
    const sql = `
        SELECT o.customerName, p.name as productName, oi.quantity, p.stock as stockLeft, oi.price
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        JOIN products p ON oi.product_id = p.id
        WHERE o.id = ?`;
    db.query(sql, [orderId], (err, results) => {
        if (err) return res.json([]);
        res.json(results);
    });
});

// Xóa đơn hàng (Xóa chi tiết trước để tránh lỗi Foreign Key)
app.delete('/api/admin/orders/:id', (req, res) => {
    const orderId = req.params.id;
    db.query("DELETE FROM order_items WHERE order_id = ?", [orderId], () => {
        db.query("DELETE FROM orders WHERE id = ?", [orderId], (err) => {
            if (err) return res.json({ success: false });
            res.json({ success: true });
        });
    });
});

// Danh sách sản phẩm (Admin)
app.get('/api/admin/products', (req, res) => {
    db.query("SELECT * FROM products", (err, results) => {
        if (err) return res.json([]);
        res.json(results);
    });
});

// Danh sách người dùng
app.get('/api/admin/users', (req, res) => {
    db.query("SELECT id, username, email, role FROM users", (err, results) => {
        if (err) return res.json([]);
        res.json(results);
    });
});

// Biểu đồ doanh thu
app.get('/api/admin/revenue-chart', (req, res) => {
    const sql = "SELECT DATE(orderDate) as date, SUM(totalAmount) as dailyTotal FROM orders GROUP BY DATE(orderDate) ORDER BY date ASC LIMIT 7";
    db.query(sql, (err, results) => {
        if (err) return res.json([]);
        res.json(results);
    });
});

// --- API ADMIN: THÊM SẢN PHẨM MỚI ---
app.post('/api/admin/products', (req, res) => {
    const { name, price, img, description, stock } = req.body;

    // Câu lệnh SQL thêm mới
    const sql = "INSERT INTO products (name, price, img, description, stock) VALUES (?, ?, ?, ?, ?)";

    db.query(sql, [name, price, img, description, stock], (err, result) => {
        if (err) {
            console.error("Lỗi thêm SP:", err);
            return res.status(500).json({ success: false, message: "Lỗi Database" });
        }
        res.json({ success: true, message: "Thêm sản phẩm thành công!", id: result.insertId });
    });
});
// --- API ADMIN: CẬP NHẬT GIÁ VÀ KHO SẢN PHẨM ---
app.put('/api/admin/products/:id', (req, res) => {
    const productId = req.params.id;
    const { price, stock } = req.body;

    const sql = "UPDATE products SET price = ?, stock = ? WHERE id = ?";

    db.query(sql, [price, stock, productId], (err, result) => {
        if (err) {
            console.error("Lỗi cập nhật SP:", err);
            return res.status(500).json({ success: false });
        }
        res.json({ success: true, message: "Đã cập nhật sản phẩm!" });
    });
});
app.listen(PORT, '0.0.0.0', () => {
    console.log(`=========================================`);
    console.log(`SERVER ĐANG CHẠY TẠI PORT: ${PORT}`);
    console.log(`=========================================`);
});