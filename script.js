const products = [
    { id: 1, name: "Ürün 1", price: 100, image: "https://via.placeholder.com/150" },
    { id: 2, name: "Ürün 2", price: 200, image: "https://via.placeholder.com/150" },
    { id: 3, name: "Ürün 3", price: 150, image: "https://via.placeholder.com/150" },
    { id: 4, name: "Ürün 4", price: 300, image: "https://via.placeholder.com/150" },
    { id: 5, name: "Ürün 5", price: 250, image: "https://via.placeholder.com/150" },
    { id: 6, name: "Ürün 6", price: 180, image: "https://via.placeholder.com/150" },
    { id: 7, name: "Ürün 7", price: 220, image: "https://via.placeholder.com/150" },
    { id: 8, name: "Ürün 8", price: 190, image: "https://via.placeholder.com/150" },
    { id: 9, name: "Ürün 9", price: 280, image: "https://via.placeholder.com/150" },
    { id: 10, name: "Ürün 10", price: 320, image: "https://via.placeholder.com/150" },
];

// Sepeti localStorage'dan yükle
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Ürünleri sayfaya yükle
function loadProducts() {
    const productsContainer = document.getElementById('products');
    products.forEach(product => {
        const productElement = document.createElement('div');
        productElement.className = 'product-card';
        
        // Sepetteki mevcut miktar kontrolü
        const cartItem = cart.find(item => item.id === product.id);
        const currentQuantity = cartItem ? cartItem.quantity : 0;
        
        productElement.innerHTML = `
            <img src="${product.image}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p>${product.price} TL</p>
            <div class="quantity-control">
                <button onclick="removeFromCart(${product.id})" class="remove-btn">-</button>
                <span class="quantity-display" id="quantity-${product.id}">${currentQuantity}</span>
                <button onclick="addToCart(${product.id})" class="add-btn">+</button>
            </div>
        `;
        productsContainer.appendChild(productElement);
    });
    updateCart(); // Başlangıçta sepeti güncelle
}

// Bildirim göster
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Onay kutusu göster
function confirmRemoval(callback) {
    if (confirm("Bu ürünü sepetinizden çıkarmak istediğinize emin misiniz?")) {
        callback(true);
    } else {
        callback(false);
    }
}

// Sepete ürün ekle
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const cartItem = cart.find(item => item.id === productId);

    if (cartItem) {
        cartItem.quantity++;
        showNotification(`${product.name} adedi güncellendi`);
    } else {
        cart.push({ ...product, quantity: 1 });
        showNotification(`${product.name} sepete eklendi`);
    }

    updateCart();
    updateQuantityDisplay(productId);
    saveCartToStorage();
}

// Sepetten ürün çıkar
function removeFromCart(productId) {
    const cartItem = cart.find(item => item.id === productId);
    if (cartItem) {
        if (cartItem.quantity > 1) {
            cartItem.quantity--;
            showNotification(`${cartItem.name} adedi güncellendi`);
        } else {
            confirmRemoval((confirmed) => {
                if (confirmed) {
                    cart = cart.filter(item => item.id !== productId);
                    showNotification(`${cartItem.name} sepetinizden çıkarıldı`);
                } else {
                    showNotification(`${cartItem.name} hala sepetinizde`);
                    return;
                }
                updateCart();
                updateQuantityDisplay(productId);
                saveCartToStorage();
            });
            return;
        }
        updateCart();
        updateQuantityDisplay(productId);
        saveCartToStorage();
    }
}

// Ürün miktarı göstergesini güncelle
function updateQuantityDisplay(productId) {
    const quantityDisplay = document.getElementById(`quantity-${productId}`);
    const cartItem = cart.find(item => item.id === productId);
    quantityDisplay.textContent = cartItem ? cartItem.quantity : 0;
}

// Sepeti localStorage'a kaydet
function saveCartToStorage() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Sepeti güncelle
function updateCart() {
    const cartItems = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cart-total');
    
    cartItems.innerHTML = '';
    let total = 0;

    cart.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        itemElement.innerHTML = `
            <span>${item.name}</span>
            <div>
                <button onclick="removeFromCart(${item.id})">-</button>
                <span>${item.quantity}</span>
                <button onclick="addToCart(${item.id})">+</button>
            </div>
            <span>${item.price * item.quantity} TL</span>
        `;
        cartItems.appendChild(itemElement);
        total += item.price * item.quantity;
    });

    cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartTotal.textContent = total;
}

// Sepeti göster/gizle
function toggleCart() {
    const cart = document.getElementById('cart');
    cart.classList.toggle('active');
}

// WhatsApp üzerinden sipariş ver
function orderViaWhatsapp() {
    const phoneNumber = "905523396844";
    let message = "Yeni Sipariş:%0A";
    
    cart.forEach(item => {
        message += `${item.name} x ${item.quantity}%0A`;
    });
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    message += `%0AToplam: ${total} TL`;
    
    // Siparişi gönder
    window.open(`https://wa.me/${phoneNumber}?text=${message}`);
    
    // Sepeti temizle
    cart = [];
    saveCartToStorage();
    updateCart();
    
    // Tüm ürün miktarlarını sıfırla
    products.forEach(product => {
        updateQuantityDisplay(product.id);
    });
}

// Sayfa yüklendiğinde ürünleri göster
window.onload = loadProducts;

// Safari ve mobil tarayıcılar için dokunma olayı desteği
document.addEventListener('DOMContentLoaded', function() {
    document.body.addEventListener('touchstart', function(){}, {passive: true});
}); 