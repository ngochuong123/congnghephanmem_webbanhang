let cart = JSON.parse(localStorage.getItem('gameCart')) || [];

// 1. Hiển thị giỏ hàng
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

// 2. Kiểm tra thông tin giao hàng
function validateShippingInfo() {
    const name = document.getElementById('customerName').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    const address = document.getElementById('customerAddress').value.trim();

    if (!name || !phone || !address) {
        alert("Bạn ơi! Điền đủ Tên, SĐT và Địa chỉ đã nhé! +))");
        return null;
    }
    return { name, phone, address };
}

// 3. Bộ dò tiền tự động (Dùng cho Chuyển khoản)
async function startAutoCheckPayment(orderData, isSingleItem = false, itemIndex = -1) {
    const overlay = document.getElementById('loadingOverlay');
    if (!overlay) return;

    overlay.style.display = 'flex';
    const statusText = overlay.querySelector('p');
    statusText.innerText = "Hệ thống đang kết nối ngân hàng... ";

    setTimeout(async () => {
        statusText.innerText = "Đã nhận tín hiệu! Đang lưu vào Database...";

        try {
            const response = await fetch('http://localhost:5000/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });

            if (!response.ok) throw new Error(`Server báo lỗi: ${response.status}`);

            const res = await response.json();

            if (res && res.success) {
                overlay.style.display = 'none';
                if (isSingleItem) {
                    alert(`Mua lẻ [${orderData.cartItems[0].name}] thành công!`);
                    cart.splice(itemIndex, 1);
                    saveAndRefresh();
                } else {
                    finishOrder("Thanh toán CẢ GIỎ HÀNG thành công! +))");
                }
            } else {
                overlay.style.display = 'none';
                alert("Lỗi lưu đơn hàng!");
            }
        } catch (error) {
            overlay.style.display = 'none';
            console.error("Lỗi chi tiết:", error);
            alert("Không thể kết nối đến máy chủ!");
        }
    }, 2000);
}

// 4. Xử lý THANH TOÁN TẤT CẢ
async function checkoutAll(e) {
    if (e) e.preventDefault();

    const info = validateShippingInfo();
    if (!info || cart.length === 0) return;

    const method = document.querySelector('input[name="payMethod"]:checked').value;
    const total = cart.reduce((s, i) => s + (i.price * i.quantity), 0);

    // Dữ liệu gói hàng chuẩn (Dùng cartItems)
    const orderData = {
        ...info,
        cartItems: cart,
        total,
        method
    };

    if (method === 'cod') {
        if (confirm(`Xác nhận đặt đơn COD: ${total.toLocaleString()} VNĐ?`)) {
            const res = await sendDataToBackend(orderData);
            if (res && res.success) {
                finishOrder("Đơn hàng COD đã xong! Kiểm tra kho ngay sếp ơi! +))");
            }
        }
    } else {
        alert("Bạn quét mã QR nhé. Hệ thống đang đợi tiền về, ĐỪNG tắt trang! +))");
        document.getElementById('transferDetail').scrollIntoView({ behavior: 'smooth' });
        updateSummary(cart.length, total, "Tong Don Hang");
        startAutoCheckPayment(orderData);
    }
}

// 5. Xử lý THANH TOÁN LẺ
async function paySingleItem(index) {
    const info = validateShippingInfo();
    if (!info) return;

    const item = cart[index];
    const subTotal = item.price * item.quantity;
    const method = document.querySelector('input[name="payMethod"]:checked').value;

    const orderData = {
        ...info,
        cartItems: [item],
        total: subTotal,
        method,
        note: `Mua lẻ: ${item.name}`
    };

    if (method === 'cod') {
        if (confirm(`Xác nhận mua riêng món [${item.name}] - COD?`)) {
            const res = await sendDataToBackend(orderData);
            if (res && res.success) {
                cart.splice(index, 1);
                saveAndRefresh();
                alert("Đã đặt hàng món lẻ thành công!");
            }
        }
    } else {
        updateSummary(1, subTotal, true);
        const detail = document.getElementById('transferDetail');
        detail.style.display = 'block';
        detail.scrollIntoView({ behavior: 'smooth' });
        alert(`Bạn vui lòng quét QR để mua riêng món: ${item.name}`);
        startAutoCheckPayment(orderData, true, index);
    }
}

// Cập nhật giao diện QR và Tổng tiền
function updateSummary(qty, price, infoText = "Thanh Toan Don Hang") {
    if (qty > 1 || infoText === "Thanh Toan Don Hang") {
        if (document.getElementById('totalQty')) document.getElementById('totalQty').innerText = qty;
        if (document.getElementById('totalPriceFinal')) document.getElementById('totalPriceFinal').innerText = price.toLocaleString() + " VNĐ";
        if (document.getElementById('subtotal')) document.getElementById('subtotal').innerText = price.toLocaleString() + " VNĐ";
    }

    const qrImg = document.querySelector('.qr-code img');
    if (qrImg) {
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
        const total = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
        const qty = cart.reduce((s, i) => s + i.quantity, 0);
        updateSummary(qty, total, "Tong Gio Hang");
    } else {
        detail.style.display = 'none';
    }
}

function showQuickQR(index) {
    const item = cart[index];
    const subTotal = item.price * item.quantity;
    document.querySelector('input[value="transfer"]').checked = true;
    document.getElementById('transferDetail').style.display = 'block';
    updateSummary(item.quantity, subTotal, `Mua le ${item.name}`);
    document.getElementById('transferDetail').scrollIntoView({ behavior: 'smooth' });
}

function generateTotalQR(e) {
    if (e) e.preventDefault();
    const method = document.querySelector('input[name="payMethod"]:checked').value;
    if (method !== 'transfer') {
        alert("Phải chọn 'Chuyển khoản' mới cần mã QR nhé! +))");
        return;
    }
    const total = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
    const qty = cart.reduce((s, i) => s + i.quantity, 0);
    document.getElementById('transferDetail').style.display = 'block';
    document.getElementById('transferDetail').scrollIntoView({ behavior: 'smooth' });
    updateSummary(qty, total, "Tong Don Hang");
}

// Gửi dữ liệu đồng bộ Backend
async function sendDataToBackend(orderData) {
    try {
        const response = await fetch('http://localhost:5000/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        return await response.json();
    } catch (error) {
        console.error("Lỗi:", error);
        alert("Hùng ơi, Server Backend chưa bật rồi! +))");
        return { success: false };
    }
}

document.addEventListener('DOMContentLoaded', displayCart);