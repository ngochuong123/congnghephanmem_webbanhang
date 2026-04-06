// 1. Lấy dữ liệu từ localStorage ngay khi vào trang
let cart = JSON.parse(localStorage.getItem('gameCart')) || [];

function displayCart() {
    const cartList = document.getElementById('cartList');
    const totalQty = document.getElementById('totalQty');
    const totalPriceFinal = document.getElementById('totalPriceFinal');
    const itemCount = document.getElementById('itemCount'); // Cái chữ "0 sản phẩm" ở trên đầu

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

        // Cộng dồn để cập nhật con số tổng ngay khi vẽ trang
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

    // CẬP NHẬT CON SỐ LÊN GIAO DIỆN NGAY LẬP TỨC
    if (itemCount) itemCount.innerText = totalCount;
    updateSummary(totalCount, totalMoney);
}

// Hàm thay đổi số lượng
function changeQty(index, delta) {
    cart[index].quantity += delta;

    // Nếu giảm xuống 0 thì hỏi có muốn xóa không
    if (cart[index].quantity < 1) {
        if (confirm("Bạn có muốn xóa sản phẩm này khỏi giỏ hàng?")) {
            cart.splice(index, 1);
        } else {
            cart[index].quantity = 1; // Giữ tối thiểu là 1
        }
    }

    localStorage.setItem('gameCart', JSON.stringify(cart));
    displayCart(); // Vẽ lại giao diện để cập nhật số và tiền
}

function updateSummary(qty, price) {
    if (document.getElementById('totalQty')) document.getElementById('totalQty').innerText = qty;
    if (document.getElementById('subtotal')) document.getElementById('subtotal').innerText = price.toLocaleString() + " VNĐ";
    if (document.getElementById('totalPriceFinal')) document.getElementById('totalPriceFinal').innerText = price.toLocaleString() + " VNĐ";
}

// 3. Hàm Xóa sản phẩm
function removeItem(index) {
    if (confirm("Bạn muốn xóa sản phẩm này khỏi giỏ hàng?")) {
        cart.splice(index, 1); // Xóa trong mảng
        localStorage.setItem('gameCart', JSON.stringify(cart)); // Cập nhật kho
        displayCart(); // Vẽ lại giao diện
    }
}

// 4. Hàm Thanh toán riêng từng món
function paySingleItem(index) {
    const item = cart[index];
    const total = item.price * item.quantity;

    alert(`[THANH TOÁN TỪNG MÓN]\nSản phẩm: ${item.name}\nSố tiền: ${total.toLocaleString()} VNĐ\n\nCảm ơn bạn đã mua hàng!`);

    // Sau khi thanh toán riêng thì xóa món đó khỏi giỏ
    cart.splice(index, 1);
    localStorage.setItem('gameCart', JSON.stringify(cart));
    displayCart();
}

// 5. Hàm Tính tổng tiền (Khi người dùng nhấn nút tính tổng)
function calculateTotal() {
    let totalMoney = 0;
    let totalCount = 0;

    cart.forEach(item => {
        totalMoney += item.price * item.quantity;
        totalCount += item.quantity;
    });

    // Cập nhật số liệu vào phần Summary
    if (document.getElementById('totalQty'))
        document.getElementById('totalQty').innerText = totalCount;

    if (document.getElementById('totalPriceFinal'))
        document.getElementById('totalPriceFinal').innerText = totalMoney.toLocaleString() + " VNĐ";

    alert("Đã cập nhật tổng tiền cho toàn bộ giỏ hàng!");
}

// Chạy hiển thị khi trang load xong
document.addEventListener('DOMContentLoaded', displayCart);