// 1. Khởi tạo danh sách sản phẩm mẫu
const products = [
    { id: 1, name: "Cuồng đao ánh sáng", price: 15000000, img: "images/cuongdaoanhsang.png", status: "Còn hàng" },
    { id: 2, name: "Móc diệt thủy quái", price: 28000000, img: "images/mocdietthuyquai.jpg", status: "Còn hàng" },
    { id: 3, name: "Vô cực ánh sáng", price: 800000, img: "images/vocucanhsang.png", status: "Còn hàng" },
    { id: 4, name: "Chùy xuyên phá", price: 1200000, img: "images/chuyxuyenpha.jpg", status: "Còn hàng" },
];

// 2. Hàm hiển thị sản phẩm
function displayProducts(data) {
    const productGrid = document.getElementById('productGrid');
    productGrid.innerHTML = ''; // Xóa nội dung cũ

    data.forEach(item => {
        const isOutOfStock = item.status === "Hết hàng";
        productGrid.innerHTML += `
            <div class="product-card">
                <div class="product-img">
                    <img src="${item.img}" alt="${item.name}">
                    ${isOutOfStock ? '<span class="badge-out">Hết hàng</span>' : ''}
                </div>
                <div class="product-info">
                    <h4>${item.name}</h4>
                    <p class="price">${item.price.toLocaleString()} VNĐ</p>
                    <button class="btn-add" ${isOutOfStock ? 'disabled' : ''}>
                        ${isOutOfStock ? 'Tạm hết hàng' : 'Thêm vào giỏ'}
                    </button>
                </div>
            </div>
        `;
    });
}

// --- PHẦN XỬ LÝ ĐĂNG NHẬP / ĐĂNG XUẤT ---

const currentUser = JSON.parse(localStorage.getItem('currentUser'));
const loginLink = document.getElementById('loginLink');
const logoutLink = document.getElementById('logoutLink');
const userGreeting = document.getElementById('userGreeting');

if (currentUser) {
    // 1. Nếu đã đăng nhập: Hiện tên, hiện nút Đăng xuất, ẩn link Đăng nhập
    userGreeting.innerText = `Chào, ${currentUser.fullname}`;
    loginLink.style.display = 'none';
    logoutLink.style.display = 'inline'; // Hiện nút đăng xuất
} else {
    // 2. Nếu chưa đăng nhập: Ẩn tên và nút Đăng xuất
    userGreeting.innerText = '';
    loginLink.style.display = 'inline';
    logoutLink.style.display = 'none';
}

// 3. Xử lý khi bấm nút Đăng xuất
logoutLink.addEventListener('click', function (e) {
    e.preventDefault(); // Chặn hành động chuyển trang mặc định của thẻ <a>

    if (confirm("Bạn có chắc chắn muốn đăng xuất không?")) {
        // Xóa thông tin người dùng hiện tại khỏi LocalStorage
        localStorage.removeItem('currentUser');

        // Thông báo và chuyển hướng về trang đăng nhập
        alert("Đã đăng xuất thành công!");
        window.location.href = 'login.html';
    }
});
// --- PHẦN XỬ LÝ TÌM KIẾM SẢN PHẨM ---

const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');

// Hàm thực hiện lọc sản phẩm
function handleSearch() {
    const searchTerm = searchInput.value.toLowerCase().trim(); // Lấy từ khóa, chuyển về chữ thường

    // Lọc mảng products ban đầu
    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm)
    );

    // Hiển thị lại danh sách đã lọc
    displayProducts(filteredProducts);

    // Thông báo nếu không tìm thấy
    const productGrid = document.getElementById('productGrid');
    if (filteredProducts.length === 0) {
        productGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 50px; color: #666;">
            Không tìm thấy sản phẩm nào khớp với từ khóa "${searchTerm}"
        </p>`;
    }
}

// Sự kiện khi click nút Tìm kiếm
searchBtn.addEventListener('click', handleSearch);

// Sự kiện khi nhấn phím Enter trong ô input
searchInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        handleSearch();
    }
    searchInput.addEventListener('input', handleSearch);
});
// Gọi hàm hiển thị lúc ban đầu
displayProducts(products);

