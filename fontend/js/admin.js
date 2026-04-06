// BIẾN TOÀN CỤC LƯU BIỂU ĐỒ
let myChart;

// --- 1. KHỞI CHẠY KHI TRANG LOAD ---
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Check quyền trước
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user || user.role !== 'admin') {
        window.location.href = 'login.html';
        return;
    }

    // 2. Hiện tên Admin
    if (document.getElementById('adminName')) {
        document.getElementById('adminName').innerText = `Sếp ${user.username}`;
    }

    // 3. Load đơn hàng (Tách riêng ra)
    loadOrders().catch(err => console.log("Chưa có đơn hàng để hiện bảng"));

    // 4. Load biểu đồ (Tách riêng ra)
    initRevenueChart().catch(err => console.log("Chưa có dữ liệu để vẽ biểu đồ"));
});

// --- 2. HÀM CHUYỂN ĐỔI TAB MENU ---
function showSection(sectionId) {
    // Ẩn tất cả các section
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(s => s.style.display = 'none');

    // Hiện section được chọn
    const activeSection = document.getElementById(`${sectionId}-section`);
    if (activeSection) {
        activeSection.style.display = 'block';
    }

    // Cập nhật trạng thái Active cho Menu sidebar
    const navLinks = document.querySelectorAll('.admin-nav a');
    navLinks.forEach(link => link.classList.remove('active'));
    // Tìm link có chứa hàm showSection tương ứng để add class active
    event.currentTarget.classList.add('active');
}

// --- 3. HÀM LẤY ĐƠN HÀNG TỪ API ---
// --- 3. HÀM LẤY ĐƠN HÀNG TỪ API (Bản đã thêm Số thứ tự STT) ---
async function loadOrders() {
    try {
        const response = await fetch('http://localhost:5000/api/admin/orders');
        const orders = await response.json();

        const orderList = document.getElementById('orderList');
        if (!orderList) return;

        // Dùng .map với (order, index) để lấy số thứ tự
        orderList.innerHTML = orders.map((order, index) => `
            <tr>
                <td style="color: #888;">${index + 1}</td> <td><b>#${order.id}</b></td>            <td>${order.customerName}</td>
                <td>${order.phone}</td>
                <td><b>${Number(order.totalAmount).toLocaleString()} VNĐ</b></td>
                <td>
                    <span class="badge ${order.paymentMethod === 'transfer' ? 'bg-blue' : 'bg-orange'}">
                        ${order.paymentMethod.toUpperCase()}
                    </span>
                </td>
                <td>${new Date(order.orderDate).toLocaleDateString('vi-VN')}</td>
                <td>
                    <button class="btn-view" onclick="viewDetail(${order.id})">Chi tiết</button>
                    <button class="btn-delete" onclick="deleteOrder(${order.id})">Xóa</button>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error("Lỗi load đơn hàng:", error);
    }
}

// --- 4. HÀM VẼ BIỂU ĐỒ DOANH THU ---
async function initRevenueChart() {
    const canvas = document.getElementById('revenueChart');
    if (!canvas) return; // Nếu không tìm thấy thẻ canvas thì thoát

    try {
        const response = await fetch('http://localhost:5000/api/admin/revenue-chart');
        const data = await response.json();

        const labels = data.map(item => new Date(item.date).toLocaleDateString('vi-VN'));
        const totals = data.map(item => item.dailyTotal);

        const ctx = canvas.getContext('2d');
        if (myChart) myChart.destroy();

        myChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Doanh thu (VNĐ)',
                    data: totals,
                    borderColor: '#4e73df',
                    backgroundColor: 'rgba(78, 115, 223, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // Để biểu đồ co dãn theo khung
                scales: { y: { beginAtZero: true } }
            }
        });
    } catch (error) {
        console.error("Lỗi vẽ biểu đồ:", error);
    }
}

// --- 5. CÁC HÀM THAO TÁC KHÁC ---
async function deleteOrder(id) {
    if (!confirm(`Hùng chắc chắn muốn xóa đơn hàng #${id} không?`)) return;
    try {
        const response = await fetch(`http://localhost:5000/api/admin/orders/${id}`, { method: 'DELETE' });
        const result = await response.json();
        if (result.success) {
            loadOrders();
            initRevenueChart();
        }
    } catch (error) { alert("Lỗi xóa đơn hàng!"); }
}

async function viewDetail(id) {
    try {
        const response = await fetch(`http://localhost:5000/api/admin/order-detail/${id}`);
        const details = await response.json();

        if (details.length === 0) {
            alert("Đơn hàng này chưa có dữ liệu chi tiết sản phẩm!");
            return;
        }

        let content = `📦 CHI TIẾT ĐƠN HÀNG #${id}\n`;
        content += `👤 Khách hàng: ${details[0].customerName}\n`;
        content += `--------------------------\n`;

        details.forEach(item => {
            content += `🎮 Sản phẩm: ${item.productName}\n`;
            content += `   - Số lượng mua: ${item.quantity}\n`;
            content += `   - Giá lúc mua: ${Number(item.price).toLocaleString()} VNĐ\n`;
            content += `   - Kho còn lại: ${item.stockLeft}\n`;
            content += `--------------------------\n`;
        });

        alert(content); // Sau này Hùng làm Modal (cửa sổ hiện lên) thì thay alert bằng Modal nhé
    } catch (error) {
        alert("Không lấy được chi tiết đơn hàng!");
    }
}
// TRONG js/admin.js
async function showSection(sectionId) {
    // 1. Ẩn tất cả section
    document.querySelectorAll('.content-section').forEach(s => s.style.display = 'none');

    // 2. Hiện section được chọn
    const activeSection = document.getElementById(`${sectionId}-section`);
    if (activeSection) activeSection.style.display = 'block';

    // 3. Xử lý menu active (Sửa lỗi hiệu ứng đứng yên)
    document.querySelectorAll('.admin-nav a').forEach(link => link.classList.remove('active'));
    // Tìm thẻ a có chứa hàm showSection('sectionId')
    const currentLink = document.querySelector(`a[onclick*="${sectionId}"]`);
    if (currentLink) currentLink.classList.add('active');

    // 4. Load dữ liệu và vẽ lại biểu đồ (Sửa lỗi mất biểu đồ)
    if (sectionId === 'orders') {
        await loadOrders();
        await initRevenueChart(); // Gọi lại hàm vẽ biểu đồ
    } else if (sectionId === 'products') {
        loadAdminProducts();
    } else if (sectionId === 'users') {
        loadAdminUsers();
    }
}

// Hàm load sản phẩm (Đảm bảo URL khớp Backend)
// 1. Cập nhật hàm load để hiện nút Sửa
async function loadAdminProducts() {
    try {
        const res = await fetch('http://localhost:5000/api/admin/products');
        const data = await res.json();
        const list = document.getElementById('adminProductList');
        if (list) {
            list.innerHTML = data.map(p => `
                <tr>
                    <td>#${p.id}</td>
                    <td>${p.name}</td>
                    <td><b style="color: #2e7d32">${Number(p.price).toLocaleString()} VNĐ</b></td>
                    <td><b>${p.stock}</b></td>
                    <td>
                        <button class="btn-view" onclick="editProduct(${p.id}, ${p.price}, ${p.stock})">
                            <i class="fa-solid fa-pen"></i> Sửa
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) { console.log(error); }
}

// 2. Hàm xử lý khi bấm nút Sửa
async function editProduct(id, oldPrice, oldStock) {
    // Hiện bảng hỏi nhập giá mới
    const newPrice = prompt(`Nhập giá mới cho sản phẩm #${id}:`, oldPrice);
    const newStock = prompt(`Nhập số lượng kho mới:`, oldStock);

    // Nếu người dùng không nhấn Cancel và nhập số hợp lệ
    if (newPrice !== null && newStock !== null) {
        try {
            const response = await fetch(`http://localhost:5000/api/admin/products/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    price: Number(newPrice),
                    stock: Number(newStock)
                })
            });

            const result = await response.json();
            if (result.success) {
                alert("Cập nhật thành công rồi sếp ơi! +))");
                loadAdminProducts(); // Load lại bảng để thấy giá mới
            }
        } catch (error) {
            alert("Lỗi kết nối Server!");
        }
    }
}

// Hàm load người dùng
async function loadAdminUsers() {
    const res = await fetch('http://localhost:5000/api/admin/users');
    const data = await res.json();
    const list = document.getElementById('adminUserList');
    if (list) {
        list.innerHTML = data.map(u => `
            <tr>
                <td>#${u.id}</td>
                <td>${u.username}</td>
                <td>${u.email}</td>
                <td><span class="badge ${u.role === 'admin' ? 'bg-blue' : 'bg-orange'}">${u.role}</span></td>
            </tr>
        `).join('');
    }
}
async function addNewProduct() {
    // 1. Lấy dữ liệu từ các ô Input
    const name = document.getElementById('p_name').value;
    const price = document.getElementById('p_price').value;
    const img = document.getElementById('p_img').value;
    const stock = document.getElementById('p_stock').value;
    const description = document.getElementById('p_desc').value;

    // 2. Kiểm tra xem đã điền đủ chưa
    if (!name || !price || !img || !stock) {
        alert("Sếp ơi điền đủ thông tin quan trọng đã nhé! +))");
        return;
    }

    const newProduct = { name, price, img, stock, description };

    try {
        // 3. Gửi sang Backend
        const response = await fetch('http://localhost:5000/api/admin/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newProduct)
        });

        const result = await response.json();

        if (result.success) {
            alert("Đã thêm game mới vào kho thành công!");
            // 4. Xóa trắng form sau khi thêm
            document.getElementById('p_name').value = '';
            document.getElementById('p_price').value = '';
            document.getElementById('p_img').value = '';
            document.getElementById('p_stock').value = '';
            document.getElementById('p_desc').value = '';

            // 5. Load lại danh sách để thấy món mới ngay
            loadAdminProducts();
        }
    } catch (error) {
        console.error("Lỗi:", error);
        alert("Không kết nối được Server!");
    }
}
function logoutAdmin() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}