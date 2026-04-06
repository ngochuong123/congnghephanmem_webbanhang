// ==========================================
// 1. KHỞI TẠO BIẾN TOÀN CỤC
// ==========================================
let products = []; // Mảng trống để chứa hàng từ MySQL

// ==========================================
// 2. HÀM LẤY DỮ LIỆU TỪ BACKEND (MySQL)
// ==========================================
async function fetchProducts() {
    try {
        const response = await fetch('https://ndtc.onrender.com/api/products');
        products = await response.json();

        // Sau khi nạp dữ liệu xong mới cho hiển thị
        displayProducts(products);
        console.log(">>> Đã tải sản phẩm từ MySQL thành công!");
    } catch (error) {
        console.error("Lỗi kết nối Backend:", error);
        const productGrid = document.getElementById('productGrid');
        if (productGrid) {
            productGrid.innerHTML = `<p style="text-align:center; padding:50px;">Hùng ơi, Server chưa bật hoặc lỗi kết nối rồi! +))</p>`;
        }
    }
}

// ==========================================
// 3. HÀM HIỂN THỊ SẢN PHẨM RA MÀN HÌNH
// ==========================================
function displayProducts(data) {
    const productGrid = document.getElementById('productGrid');
    if (!productGrid) return;

    productGrid.innerHTML = '';

    data.forEach(item => {
        const isOutOfStock = item.status === "Hết hàng";
        productGrid.innerHTML += `
            <div class="product-card">
                <div class="product-img" onclick="showProductDetail(${item.id})">
                    <img src="${item.img}" alt="${item.name}">
                </div>
                <div class="product-info">
                    <h4>${item.name}</h4>
                    <p class="price">${Number(item.price).toLocaleString()} VNĐ</p>
                    <button class="btn-add" 
                            ${isOutOfStock ? 'disabled' : ''} 
                            onclick="addToCart(${item.id})">
                        ${isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ'}
                    </button>
                </div>
            </div>`;
    });
}

// ==========================================
// 4. HIỂN THỊ CHI TIẾT SẢN PHẨM (MODAL)
// ==========================================
function showProductDetail(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    document.getElementById('modalImg').src = product.img;
    document.getElementById('modalName').innerText = product.name;
    document.getElementById('modalPrice').innerText = Number(product.price).toLocaleString() + " VNĐ";

    // Lưu ý: Dùng .description để khớp với tên cột trong MySQL của Hùng
    document.getElementById('modalDesc').innerText = product.description || `Siêu phẩm ${product.name} tại GameStore.`;

    const modal = document.getElementById('productModal');
    modal.style.display = "block";
    document.body.style.overflow = "hidden";

    const btnAddLarge = document.querySelector('.btn-add-large');
    if (btnAddLarge) {
        btnAddLarge.onclick = () => addToCart(product.id);
    }
}

// Đóng Modal
const modal = document.getElementById('productModal');
const closeModal = document.querySelector('.close-modal');
if (closeModal) {
    closeModal.onclick = () => {
        modal.style.display = "none";
        document.body.style.overflow = "auto";
    };
}
window.onclick = (event) => {
    if (event.target == modal) {
        modal.style.display = "none";
        document.body.style.overflow = "auto";
    }
};

// ==========================================
// 5. XỬ LÝ ĐĂNG NHẬP / ĐĂNG XUẤT
// ==========================================
function updateAuthUI() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const userGreeting = document.getElementById('userGreeting');
    const loginLink = document.getElementById('loginLink');
    const logoutLink = document.getElementById('logoutLink');

    if (currentUser) {
        // HIỂN THỊ TÊN: Dùng .username để khớp với Backend trả về
        if (userGreeting) userGreeting.innerText = `Chào, ${currentUser.username}`;
        if (loginLink) loginLink.style.display = 'none';
        if (logoutLink) logoutLink.style.display = 'inline';
    } else {
        if (userGreeting) userGreeting.innerText = '';
        if (loginLink) loginLink.style.display = 'inline';
        if (logoutLink) logoutLink.style.display = 'none';
    }
}

const logoutLink = document.getElementById('logoutLink');
if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm("Hùng muốn đăng xuất à? +))")) {
            localStorage.removeItem('currentUser');
            window.location.href = 'login.html';
        }
    });
}

// ==========================================
// 6. XỬ LÝ TÌM KIẾM SẢN PHẨM
// ==========================================
function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    const searchTerm = searchInput.value.toLowerCase().trim();

    // Lọc trên mảng products (đã fetch)
    const filtered = products.filter(p => p.name.toLowerCase().includes(searchTerm));
    displayProducts(filtered);

    const productGrid = document.getElementById('productGrid');
    if (filtered.length === 0) {
        productGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 50px;">Không thấy món nào tên "${searchTerm}" hết Hùng ơi!</p>`;
    }
}

const searchBtn = document.getElementById('searchBtn');
const searchInput = document.getElementById('searchInput');

if (searchBtn) searchBtn.addEventListener('click', handleSearch);
if (searchInput) {
    searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSearch(); });
    searchInput.addEventListener('input', handleSearch); // Tìm kiếm thời gian thực
}

// ==========================================
// 7. GIỎ HÀNG
// ==========================================
function addToCart(productId) {
    let cart = JSON.parse(localStorage.getItem('gameCart')) || [];
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existing = cart.find(item => item.id === productId);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    localStorage.setItem('gameCart', JSON.stringify(cart));
    updateCartCount();
    alert(`Đã thêm ${product.name} vào giỏ!`);
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('gameCart')) || [];
    const countElement = document.getElementById('cartCount');
    if (countElement) {
        const total = cart.reduce((sum, item) => sum + item.quantity, 0);
        countElement.innerText = total;
    }
}

// ==========================================
// 8. KHỞI CHẠY KHI LOAD TRANG
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();   // Lấy hàng từ MySQL
    updateAuthUI();    // Hiện tên người dùng
    updateCartCount(); // Cập nhật con số giỏ hàng
});