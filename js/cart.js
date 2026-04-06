// 1. Khai báo mảng cart ở phạm vi toàn cục để mọi hàm đều thấy
let cart = JSON.parse(localStorage.getItem('gameCart')) || [];

function displayCart() {
    const cartList = document.getElementById('cartList');
    const itemCount = document.getElementById('itemCount');

    if (!cartList) return;

    if (cart.length === 0) {
        cartList.innerHTML = `<p style="text-align:center; padding: 50px;">Giỏ hàng của bạn đang trống.</p>`;
        if (itemCount) itemCount.innerText = "0";
        updateSummary(0, 0);
        return;
    }

    // Đảo ngược mảng để hiện món mới nhất lên đầu (Stack)
    const displayData = [...cart].reverse();
    let html = '';
    let totalMoney = 0;
    let totalCount = 0;

    displayData.forEach((item, index) => {
        const originalIndex = cart.length - 1 - index;
        const subTotal = item.price * item.quantity;

        // Tự động cộng dồn tiền và số lượng
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
            </div>
        `;
    });

    cartList.innerHTML = html;

    // Luôn cập nhật con số ở tiêu đề và bảng tổng kết tự động
    if (itemCount) itemCount.innerText = totalCount;
    updateSummary(totalCount, totalMoney);
}

// Hàm thay đổi số lượng (Tự động lưu và vẽ lại trang)
function changeQty(index, delta) {
    cart[index].quantity += delta;
    if (cart[index].quantity < 1) {
        if (confirm("Xóa sản phẩm này khỏi giỏ hàng?")) {
            cart.splice(index, 1);
        } else {
            cart[index].quantity = 1;
        }
    }
    saveAndRefresh();
}

// Hàm xóa sản phẩm
function removeItem(index) {
    if (confirm("Bạn chắc chắn muốn xóa?")) {
        cart.splice(index, 1);
        saveAndRefresh();
    }
}

// Hàm cập nhật các con số ở bảng bên phải (Summary)
function updateSummary(qty, price) {
    const totalQty = document.getElementById('totalQty');
    const subtotal = document.getElementById('subtotal');
    const totalPriceFinal = document.getElementById('totalPriceFinal');

    if (totalQty) totalQty.innerText = qty;
    if (subtotal) subtotal.innerText = price.toLocaleString() + " VNĐ";
    if (totalPriceFinal) totalPriceFinal.innerText = price.toLocaleString() + " VNĐ";
}

// Hàm lưu vào kho và vẽ lại giao diện
function saveAndRefresh() {
    localStorage.setItem('gameCart', JSON.stringify(cart));
    displayCart();
}

// --- ĐÂY LÀ HÀM CHO NÚT TO Ở DƯỚI ---
function checkoutAll() {
    if (cart.length === 0) {
        alert("Giỏ hàng trống!");
        return;
    }

    let total = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
    if (confirm(`Xác nhận thanh toán đơn hàng: ${total.toLocaleString()} VNĐ?`)) {
        alert("Thanh toán thành công! Cảm ơn Hùng đã ủng hộ GameStore.");
        localStorage.removeItem('gameCart');
        window.location.href = 'index.html';
    }
}

function paySingleItem(index) {
    alert(`Đã thanh toán món: ${cart[index].name}`);
    cart.splice(index, 1);
    saveAndRefresh();
}

// Khởi động trang
document.addEventListener('DOMContentLoaded', displayCart);