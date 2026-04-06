let cart = JSON.parse(localStorage.getItem('gameCart')) || [];

// 1. Hiển thị giỏ hàng (Giữ nguyên logic của Hùng)
function displayCart() {
    const cartList = document.getElementById('cartList');
    const itemCount = document.getElementById('itemCount');
    if (!cartList) return;

    if (cart.length === 0) {
        cartList.innerHTML = `<p style="text-align:center; padding: 50px;">Giỏ hàng trống.</p>`;
        if (itemCount) itemCount.innerText = "0";
        updateSummary(0, 0);
        return;
    }

    const displayData = [...cart].reverse();
    let html = '';
    let totalMoney = 0;
    let totalCount = 0;

    displayData.forEach((item, index) => {
        const originalIndex = cart.length - 1 - index;
        const subTotal = item.price * item.quantity;
        totalMoney += subTotal;
        totalCount += item.quantity;

        // Tìm đoạn html += ` ... ` trong hàm displayCart và chèn thêm nút QR
        html += `
        <div class="cart-item">
        <img src="${item.img}" alt="${item.name}">
        <div class="item-details">
            <h3>${item.name}</h3>
            <p class="item-price">${Number(item.price).toLocaleString()} VNĐ</p>
            <div class="quantity-controls">
                <button class="btn-qty" onclick="changeQty(${originalIndex}, -1)">-</button>
                <span class="qty-number">${item.quantity}</span>
                <button class="btn-qty" onclick="changeQty(${originalIndex}, 1)">+</button>
            </div>
        </div>
        <div class="item-actions">
            <p class="subtotal">Thành tiền: <b>${subTotal.toLocaleString()} VNĐ</b></p>
            <div class="btn-group">
                <button class="btn-qr-small" onclick="showQuickQR(${originalIndex})" title="Quét mã mua lẻ món này">
                    <i class="fa-solid fa-qrcode"></i>
                </button>
                <button class="btn-pay-item" onclick="paySingleItem(${originalIndex})">MUA LẺ</button>
                <button class="btn-remove-item" onclick="removeItem(${originalIndex})">Xóa</button>
            </div>
        </div>
    </div>`;
    });

    cartList.innerHTML = html;
    if (itemCount) itemCount.innerText = totalCount;
    updateSummary(totalCount, totalMoney);
}

// 2. Kiểm tra thông tin
function validateShippingInfo() {
    const name = document.getElementById('customerName').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    const address = document.getElementById('customerAddress').value.trim();

    if (!name || !phone || !address) {
        alert("Hùng ơi! Điền đủ Tên, SĐT và Địa chỉ đã nhé! +))");
        return null;
    }
    return { name, phone, address };
}

// --- GỬI DỮ LIỆU CHUNG (Backend) ---
async function startAutoCheckPayment(orderData, isSingleItem = false, itemIndex = -1) {
    const overlay = document.getElementById('loadingOverlay');
    if (!overlay) return;

    overlay.style.display = 'flex';
    const statusText = overlay.querySelector('p');
    statusText.innerText = "Hệ thống đang kết nối ngân hàng... ";

    // Đợi 2 giây "nghệ thuật"
    setTimeout(async () => {
        statusText.innerText = "Đã nhận tín hiệu! Đang lưu vào Database...";

        try {
            const response = await fetch('http://localhost:5000/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });

            // Nếu Server trả về lỗi (404, 500...)
            if (!response.ok) {
                throw new Error(`Server báo lỗi: ${response.status}`);
            }

            const res = await response.json();

            if (res && res.success) {
                // Thành công rực rỡ
                overlay.style.display = 'none';
                if (isSingleItem) {
                    alert(`Mua lẻ [${orderData.items[0].name}] thành công!`);
                    cart.splice(itemIndex, 1);
                    saveAndRefresh();
                } else {
                    finishOrder("Thanh toán CẢ GIỎ HÀNG thành công! +))");
                }
            } else {
                overlay.style.display = 'none';
                alert("Backend trả về success: false. Hùng kiểm tra lại file index.js nhé!");
            }

        } catch (error) {
            overlay.style.display = 'none';
            console.error("Lỗi chi tiết:", error);
            alert("LỖI KẾT NỐI: Hùng đã bật Server ở cổng 5000 chưa? Hoặc kiểm tra lỗi CORS trong index.js nhé!");
        }
    }, 2000);
}
// 4. Xử lý THANH TOÁN TẤT CẢ
async function checkoutAll(e) {
    // CHẶN LOAD TRANG NGAY LẬP TỨC
    if (e) e.preventDefault();

    const info = validateShippingInfo();
    if (!info || cart.length === 0) return;

    const method = document.querySelector('input[name="payMethod"]:checked').value;
    const total = cart.reduce((s, i) => s + (i.price * i.quantity), 0);

    if (method === 'cod') {
        if (confirm(`Xác nhận đặt đơn COD: ${total.toLocaleString()} VNĐ?`)) {
            const res = await sendDataToBackend({ ...info, items: cart, total, method: 'cod' });
            if (res?.success) finishOrder("Đơn hàng COD đã xong!");
        }
    } else {
        // PHẦN QUAN TRỌNG: Hiện QR và đứng yên tại chỗ để dò tiền
        alert("Hùng quét mã QR nhé. Hệ thống đang đợi tiền về, ĐỪNG tắt trang! +))");
        document.getElementById('transferDetail').scrollIntoView({ behavior: 'smooth' });

        // Cập nhật QR tổng trước khi dò
        updateSummary(cart.length, total, "Tong Don Hang");

        // Gọi hàm dò tiền (Hàm này có Loading Overlay che màn hình nên khách không bấm lung tung được)
        startAutoCheckPayment({ ...info, items: cart, total, method: 'transfer' });
    }
}

// 5. Xử lý THANH TOÁN LẺ
async function paySingleItem(index) {
    const info = validateShippingInfo();
    if (!info) return;

    const item = cart[index];
    const subTotal = item.price * item.quantity;
    const method = document.querySelector('input[name="payMethod"]:checked').value;

    // Tạo gói dữ liệu đơn hàng cho riêng món này
    const orderData = {
        ...info,
        items: [item],
        total: subTotal,
        method,
        note: `Mua lẻ: ${item.name}`
    };

    if (method === 'cod') {
        if (confirm(`Xác nhận mua riêng món [${item.name}] - COD?`)) {
            const res = await sendDataToBackend(orderData);
            if (res && res.success) {
                cart.splice(index, 1); // Xóa món đó khỏi giỏ
                saveAndRefresh();
                alert("Đã đặt hàng món lẻ thành công!");
            }
        }
    } else {
        // 1. Cập nhật mã QR riêng cho món này (Dùng hàm đã sửa ở trên)
        updateSummary(1, subTotal, true);

        // 2. Hiện phần QR và cuộn xuống
        const detail = document.getElementById('transferDetail');
        detail.style.display = 'block';
        detail.scrollIntoView({ behavior: 'smooth' });

        alert(`Hùng vui lòng quét QR để mua riêng món: ${item.name}`);

        // 3. Bật bộ dò tiền tự động (truyền tham số báo là thanh toán lẻ)
        startAutoCheckPayment(orderData, true, index);
    }
}

// Sửa lại hàm để có thể nhận giá trị tùy chọn
function updateSummary(qty, price, infoText = "Thanh Toan Don Hang") {
    // 1. Cập nhật chữ số trên giao diện (nếu không phải mua lẻ)
    if (qty > 1 || infoText === "Thanh Toan Don Hang") {
        if (document.getElementById('totalQty')) document.getElementById('totalQty').innerText = qty;
        if (document.getElementById('totalPriceFinal')) document.getElementById('totalPriceFinal').innerText = price.toLocaleString() + " VNĐ";
        if (document.getElementById('subtotal')) document.getElementById('subtotal').innerText = price.toLocaleString() + " VNĐ";
    }

    // 2. Cập nhật QR Code - Quan trọng nhất là phần addInfo
    const qrImg = document.querySelector('.qr-code img');
    if (qrImg) {
        // Hùng dùng encodeURIComponent để tránh lỗi font khi truyền tiếng Việt vào link ảnh
        const description = encodeURIComponent(`GameStore ${infoText}`);
        qrImg.src = `https://img.vietqr.io/image/MB-0967444300-compact2.png?amount=${price}&addInfo=${description}`;
    }
}

function finishOrder(msg) {
    alert(msg);
    localStorage.removeItem('gameCart');
    window.location.href = 'index.html';
}

function changeQty(index, delta) {
    cart[index].quantity += delta;
    if (cart[index].quantity < 1) {
        if (confirm("Xóa sản phẩm?")) cart.splice(index, 1);
        else cart[index].quantity = 1;
    }
    saveAndRefresh();
}

function removeItem(index) {
    if (confirm("Xóa sản phẩm này?")) {
        cart.splice(index, 1);
        saveAndRefresh();
    }
}

function saveAndRefresh() {
    localStorage.setItem('gameCart', JSON.stringify(cart));
    displayCart();
}

function togglePaymentInfo() {
    const method = document.querySelector('input[name="payMethod"]:checked').value;
    const detail = document.getElementById('transferDetail');

    if (method === 'transfer') {
        detail.style.display = 'block';
        // Khi vừa mở tab chuyển khoản, hiện QR của TỔNG GIỎ HÀNG
        const total = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
        const qty = cart.reduce((s, i) => s + i.quantity, 0);
        updateSummary(qty, total, "Tong Gio Hang");
    } else {
        detail.style.display = 'none';
    }
}
// 1. Hàm hiện QR nhanh cho 1 món
function showQuickQR(index) {
    const item = cart[index];
    const subTotal = item.price * item.quantity;

    // Tự động tích chuyển khoản
    document.querySelector('input[value="transfer"]').checked = true;
    document.getElementById('transferDetail').style.display = 'block';

    // Cập nhật QR lẻ
    updateSummary(item.quantity, subTotal, `Mua le ${item.name}`);

    // QUAN TRỌNG: Reset nút QR tổng về trạng thái ban đầu
    const btn = document.getElementById('btnGenTotalQR');
    btn.style.background = "#6c757d"; // Quay về màu xám
    btn.innerHTML = '<i class="fa-solid fa-qrcode"></i> HIỆN MÃ QR TỔNG TIỀN';
    document.getElementById('transferDetail').scrollIntoView({ behavior: 'smooth' });
}
// 2. Hàm xử lý nút "HIỆN MÃ QR TỔNG TIỀN"
function generateTotalQR(e) {
    if (e) e.preventDefault();

    const method = document.querySelector('input[name="payMethod"]:checked').value;
    if (method !== 'transfer') {
        alert("Hùng ơi! Bạn phải chọn phương thức 'Chuyển khoản' thì mới cần hiện mã QR chứ! +))");
        return;
    }

    const total = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
    const qty = cart.reduce((s, i) => s + i.quantity, 0);

    // Hiện khung QR
    const detail = document.getElementById('transferDetail');
    detail.style.display = 'block';
    detail.scrollIntoView({ behavior: 'smooth' });

    // Gọi hàm cập nhật ảnh QR
    updateSummary(qty, total, "Tong Don Hang");


    // Đổi màu nút để khách biết đã bấm thành công
    const btn = document.getElementById('btnGenTotalQR');
    btn.style.background = "#28a745"; // Đổi sang màu xanh lá
    btn.innerHTML = '<i class="fa-solid fa-check"></i> ĐÃ HIỆN QR TỔNG';
}
// 2. Sửa lại hàm paySingleItem để chặn load trang
async function paySingleItem(index) {
    const info = validateShippingInfo();
    if (!info) return;

    const item = cart[index];
    const subTotal = item.price * item.quantity;
    const method = document.querySelector('input[name="payMethod"]:checked').value;

    if (method === 'cod') {
        if (confirm(`Xác nhận mua lẻ [${item.name}] - COD?`)) {
            const res = await sendDataToBackend({ ...info, items: [item], total: subTotal, method: 'cod' });
            if (res?.success) {
                cart.splice(index, 1);
                saveAndRefresh();
                alert("Đặt hàng thành công!");
            }
        }
    } else {
        // CHẶN LOAD: Nếu chọn Chuyển khoản, PHẢI đợi ting ting mới chạy tiếp
        alert("Hệ thống đang kiểm tra thanh toán. Hùng đừng tắt trang cho đến khi có thông báo thành công nhé!");

        // Gọi bộ dò tiền tự động (hàm này đã có logic chặn bằng Loading Overlay)
        startAutoCheckPayment({ ...info, items: [item], total: subTotal, method: 'transfer' }, true, index);
    }
}

document.addEventListener('DOMContentLoaded', displayCart);