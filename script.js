const products = [
    { id: 1, name: "SARIMSAKLI EKMEK", price: 75, image: "https://images.unsplash.com/photo-1573821663912-569905455b1c?w=500" },
    { id: 2, name: "MARGHERİTA", price: 100, image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500" },
    { id: 3, name: "KURU ETLİ", price: 150, image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500" },
    { id: 4, name: "MANTARLI", price: 110, image: "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=500" },
    { id: 5, name: "GİRİT VE KABAKLI", price: 120, image: "https://images.unsplash.com/photo-1528137871618-79d2761e3fd5?w=500" },
    { id: 6, name: "VEGAN", price: 170, image: "https://images.unsplash.com/photo-1542834369-f10ebf06d3e0?w=500" },
];

// Sepeti localStorage'dan yükle
let cart = JSON.parse(localStorage.getItem('cart')) || [];

let lastRemovedCart = null; // Geri alma işlemi için son silinen sepeti sakla

// Ürünleri sayfaya yükle
function loadProducts() {
    const productsContainer = document.getElementById('products');
    products.forEach(product => {
        const productElement = document.createElement('div');
        productElement.className = 'product-card';
        productElement.style.backgroundImage = `url(${product.image})`;
        
        // Sepetteki mevcut miktar kontrolü
        const cartItem = cart.find(item => item.id === product.id);
        const currentQuantity = cartItem ? cartItem.quantity : 0;
        
        productElement.innerHTML = `
            <h3>${product.name}</h3>
            <p><span>${product.price}</span> <span>TL</span></p>
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
function showNotification(message, showUndo = false) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    if (showUndo) {
        notification.innerHTML = `
            <span>${message}</span>
            <button class="undo-button" onclick="undoCartClear()">İşlemi Geri Al</button>
        `;
    } else {
        notification.innerHTML = `<span>${message}</span>`;
    }
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
                <span class="quantity">${item.quantity}</span>
                <button onclick="addToCart(${item.id})">+</button>
            </div>
            <span class="price">${item.price * item.quantity} TL</span>
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
    const overlay = document.querySelector('.overlay');
    cart.classList.toggle('active');
    
    // Overlay yoksa oluştur
    if (!overlay) {
        const newOverlay = document.createElement('div');
        newOverlay.className = 'overlay';
        document.body.appendChild(newOverlay);
        newOverlay.addEventListener('click', toggleCart);
    }
    
    // Overlay'i göster/gizle
    const currentOverlay = document.querySelector('.overlay');
    if (cart.classList.contains('active')) {
        currentOverlay.classList.add('active');
    } else {
        currentOverlay.classList.remove('active');
        setTimeout(() => {
            if (currentOverlay && !cart.classList.contains('active')) {
                currentOverlay.remove();
            }
        }, 300);
    }
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

// Sepeti temizle
function clearCart() {
    if (confirm('Sepetteki tüm ürünleri silmek istediğinizden emin misiniz?')) {
        lastRemovedCart = [...cart]; // Mevcut sepeti sakla
        cart = [];
        saveCartToStorage();
        updateCart();
        showNotification('Sepet temizlendi', true);
        products.forEach(product => {
            updateQuantityDisplay(product.id);
        });
    }
}

// Geri alma işlemi
function undoCartClear() {
    if (lastRemovedCart) {
        cart = [...lastRemovedCart];
        saveCartToStorage();
        updateCart();
        products.forEach(product => {
            updateQuantityDisplay(product.id);
        });
        showNotification('İşlem geri alındı', true);
        lastRemovedCart = null;
    }
}

// Sayfa yüklendiğinde ürünleri göster
window.onload = loadProducts;

// Safari ve mobil tarayıcılar için dokunma olayı desteği
document.addEventListener('DOMContentLoaded', function() {
    document.body.addEventListener('touchstart', function(){}, {passive: true});
}); 