let cart = JSON.parse(localStorage.getItem('gameCart')) || [];

// 1. Hiển thị giỏ hàng và tự động cập nhật QR
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
                    <p class="item-price">${item.price.toLocaleString()} VNĐ</p>
                    <div class="quantity-controls">
                        <button class="btn-qty" onclick="changeQty(${originalIndex}, -1)">-</button>
                        <span class="qty-number">${item.quantity}</span>
                        <button class="btn-qty" onclick="changeQty(${originalIndex}, 1)">+</button>
                    </div>
                </div>
                <div class="item-actions">
                    <p class="subtotal">Thành tiền: <b>${subTotal.toLocaleString()} VNĐ</b></p>
                    <div class="btn-group">
                        <button class="btn-pay-item" onclick="paySingleItem(${originalIndex})">THANH TOÁN MÓN NÀY</button>
                        <button class="btn-remove-item" onclick="removeItem(${originalIndex})">Xóa</button>
                    </div>
                </div>
            </div>`;
    });

    cartList.innerHTML = html;
    if (itemCount) itemCount.innerText = totalCount;
    updateSummary(totalCount, totalMoney);
}

// 2. Kiểm tra thông tin (Validate) - PHẢI CHUẨN ĐỂ HIỆN THÔNG BÁO
function validateShippingInfo() {
    const name = document.getElementById('customerName').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    const address = document.getElementById('customerAddress').value.trim();

    if (!name || !phone || !address) {
        alert("Bạn ơi! Phải điền đủ Tên, SĐT và Địa chỉ mới mua hàng được nhé! +))");
        return null;
    }

    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(phone)) {
        alert("Số điện thoại phải từ 10-11 chữ số nhé!");
        document.getElementById('customerPhone').focus();
        return null;
    }

    return { name, phone, address };
}

// 3. Xử lý THANH TOÁN TẤT CẢ
function checkoutAll() {
    const info = validateShippingInfo();
    if (!info) return;

    const method = document.querySelector('input[name="payMethod"]:checked').value;
    const total = cart.reduce((s, i) => s + (i.price * i.quantity), 0);

    if (method === 'cod') {
        if (confirm(`Xác nhận đặt hàng COD cho đơn ${total.toLocaleString()} VNĐ?`)) {
            finishOrder("Đặt hàng thành công! Shipper sẽ sớm gọi cho Hùng.");
        }
    } else {
        showLoading(() => {
            finishOrder("Ngân hàng báo tiền đã về! Thanh toán trọn bộ thành công.");
        });
    }
}

// 4. Xử lý THANH TOÁN LẺ TỪNG MÓN
function paySingleItem(index) {
    const info = validateShippingInfo();
    if (!info) return;

    const item = cart[index];
    const subTotal = item.price * item.quantity;
    const method = document.querySelector('input[name="payMethod"]:checked').value;

    if (method === 'cod') {
        if (confirm(`Mua riêng món [${item.name}] - Thanh toán khi nhận hàng?`)) {
            cart.splice(index, 1);
            saveAndRefresh();
            alert("Đặt hàng lẻ thành công!");
        }
    } else {
        // Chuyển khoản: Hiện loading
        showLoading(() => {
            alert(`Đã nhận ${subTotal.toLocaleString()} VNĐ cho món ${item.name}!`);
            cart.splice(index, 1);
            saveAndRefresh();
        });
    }
}

// 5. Các hàm bổ trợ (Loading, Refresh, Update QR)
function showLoading(callback) {
    const overlay = document.getElementById('loadingOverlay');
    overlay.style.display = 'flex';
    setTimeout(() => {
        overlay.style.display = 'none';
        callback();
    }, 3000); // Đợi 3 giây
}

function updateSummary(qty, price) {
    if (document.getElementById('totalQty')) document.getElementById('totalQty').innerText = qty;
    if (document.getElementById('totalPriceFinal')) document.getElementById('totalPriceFinal').innerText = price.toLocaleString() + " VNĐ";
    if (document.getElementById('subtotal')) document.getElementById('subtotal').innerText = price.toLocaleString() + " VNĐ";

    const qrImg = document.querySelector('.qr-code img');
    if (qrImg) {
        qrImg.src = `https://img.vietqr.io/image/MB-0967444300-compact2.png?amount=${price}&addInfo=GameStore%20Thanh%20Toan`;
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

function saveAndRefresh() {
    localStorage.setItem('gameCart', JSON.stringify(cart));
    displayCart();
}

function togglePaymentInfo() {
    const method = document.querySelector('input[name="payMethod"]:checked').value;
    document.getElementById('transferDetail').style.display = (method === 'transfer') ? 'block' : 'none';
}

document.addEventListener('DOMContentLoaded', displayCart);