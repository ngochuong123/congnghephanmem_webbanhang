// 1. Khởi tạo danh sách sản phẩm mẫu
const products = [
    {
        id: 1,
        name: "Cuồng đao ánh sáng",
        price: 15000000,
        img: "images/cuongdaoanhsang.png",
        status: "Còn hàng",
        desc: "Vũ khí huyền thoại tăng 50% tốc độ đánh. Mỗi đòn đánh thứ 3 sẽ gây thêm sát thương phép và hồi phục năng lượng cho chủ sở hữu."
    },
    {
        id: 2,
        name: "Móc diệt thủy quái",
        price: 28000000,
        img: "images/mocdietthuyquai.jpg",
        status: "Còn hàng",
        desc: "Trang bị tối thượng để đối đầu với các tanker. Gây sát thương chuẩn dựa trên phần trăm máu tối đa của đối phương."
    },
    {
        id: 3,
        name: "Vô cực ánh sáng",
        price: 800000,
        img: "images/vocucanhsang.png",
        status: "Còn hàng",
        desc: "Tăng mạnh tỉ lệ chí mạng và sát thương chí mạng. Khiến mỗi phát bắn của bạn trở thành nỗi khiếp sợ trên chiến trường."
    },
    {
        id: 4,
        name: "Chùy xuyên phá",
        price: 1200000,
        img: "images/chuyxuyenpha.jpg",
        status: "Còn hàng",
        desc: "Vũ khí công thành hạng nặng. Tăng sát thương lên công trình và giúp bạn càn quét lính cực nhanh trong giai đoạn đẩy đường."
    }
];

// 2. Hàm hiển thị sản phẩm
function displayProducts(data) {
    const productGrid = document.getElementById('productGrid');
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
                    <p class="price">${item.price.toLocaleString()} VNĐ</p>
                    
                    <button class="btn-add" 
                            ${isOutOfStock ? 'disabled' : ''} 
                            onclick="addToCart(${item.id})">
                        ${isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ'}
                    </button>
                </div>
            </div>
        `;
    });
}

const modal = document.getElementById('productModal');
const closeModal = document.querySelector('.close-modal');

// Hàm hiển thị chi tiết
function showProductDetail(id) {
    // 1. Tìm sản phẩm trong mảng dựa trên ID
    const product = products.find(p => p.id === id);

    if (!product) return;

    // 2. Đổ dữ liệu vào Modal
    // LƯU Ý: Phải là .img (khớp với item.img trong hàm display của bạn)
    document.getElementById('modalImg').src = product.img;
    document.getElementById('modalName').innerText = product.name;
    document.getElementById('modalPrice').innerText = product.price.toLocaleString() + " VNĐ";

    // Thêm mô tả mặc định (hoặc lấy từ dữ liệu nếu có)
    const descText = product.desc || `Siêu phẩm ${product.name} đang cực hot tại GameStore. Giá sinh viên UET!`;
    document.getElementById('modalDesc').innerText = descText;

    // 3. Hiển thị Modal
    const modal = document.getElementById('productModal');
    modal.style.display = "block";
    document.body.style.overflow = "hidden"; // Chặn cuộn trang chủ

    // Tìm nút btn-add-large trong modal và gắn:
    const btnAddLarge = document.querySelector('.btn-add-large');
    btnAddLarge.onclick = () => {
        addToCart(product.id);
    };
}

// Đóng modal khi bấm nút X
closeModal.onclick = function () {
    modal.style.display = "none";
    document.body.style.overflow = "auto";
}

// Đóng modal khi bấm ra ngoài vùng trắng
window.onclick = function (event) {
    if (event.target == modal) {
        modal.style.display = "none";
        document.body.style.overflow = "auto";
    }
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
function addToCart(productId) {
    let cart = JSON.parse(localStorage.getItem('gameCart')) || [];
    const product = products.find(p => p.id === productId);

    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    // LƯU DỮ LIỆU
    localStorage.setItem('gameCart', JSON.stringify(cart));

    // QUAN TRỌNG: Gọi hàm cập nhật con số ngay lập tức sau khi lưu
    updateCartCount();

    alert(`Đã thêm ${product.name} vào giỏ!`);
}

// Hàm này phải được gọi cả khi vừa load trang (để hiện số cũ) 
// và khi vừa nhấn nút "Thêm" (để hiện số mới)
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('gameCart')) || [];
    const countElement = document.getElementById('cartCount');
    if (countElement) {
        const total = cart.reduce((sum, item) => sum + item.quantity, 0);
        countElement.innerText = total;
    }
}

// Gọi luôn khi load trang chủ
updateCartCount();
// Gọi hàm hiển thị lúc ban đầu
displayProducts(products);

