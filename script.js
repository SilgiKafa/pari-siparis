// Ürünleri localStorage'dan yükle (artık sabit dizi yerine)
let products = JSON.parse(localStorage.getItem('publicProducts')) || [
    { id: 1, name: "SARIMSAKLI EKMEK", price: 75, stock: 10, image: "https://images.unsplash.com/photo-1573821663912-569905455b1c?w=500" },
    { id: 2, name: "MARGHERİTA", price: 100, stock: 15, image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500" },
    { id: 3, name: "KURU ETLİ", price: 150, stock: 20, image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500" },
    { id: 4, name: "MANTARLI", price: 110, stock: 12, image: "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=500" },
    { id: 5, name: "GİRİT VE KABAKLI", price: 120, stock: 8, image: "https://images.unsplash.com/photo-1528137871618-79d2761e3fd5?w=500" },
    { id: 6, name: "VEGAN", price: 170, stock: 5, image: "https://images.unsplash.com/photo-1542834369-f10ebf06d3e0?w=500" },
];

// Sepeti localStorage'dan yükle
let cart = JSON.parse(localStorage.getItem('cart')) || [];

let lastRemovedCart = null; // Geri alma işlemi için son silinen sepeti sakla

// Bildirim kuyruğu ve yönetimi
let notificationQueue = [];
let isShowingNotification = false;

// Ürünleri sayfaya yükle
function loadProducts() {
    const productsContainer = document.getElementById('products');
    productsContainer.innerHTML = '';
    
    // Sadece aktif ürünleri göster
    products.filter(product => product.active !== false).forEach(product => {
        const productElement = document.createElement('div');
        productElement.className = 'product-card';
        productElement.style.backgroundImage = `url(${product.image})`;
        
        const cartItem = cart.find(item => item.id === product.id);
        const currentQuantity = cartItem ? cartItem.quantity : 0;
        const stockClass = product.stock <= 0 ? 'out-of-stock' : 
                         product.stock <= 5 ? 'low-stock' : '';
        
        productElement.innerHTML = `
            <h3>${product.name}</h3>
            <p><span>${product.price}</span> <span>TL</span></p>
            <p class="stock-info ${stockClass}">Stok: ${product.stock}</p>
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
function showNotification(message, duration = 3000, isWarning = false) {
    notificationQueue.push({ message, duration, isWarning });
    if (!isShowingNotification) {
        showNextNotification();
    }
}

// Sıradaki bildirimi göster
function showNextNotification() {
    if (notificationQueue.length === 0) {
        isShowingNotification = false;
        return;
    }

    isShowingNotification = true;
    const { message, duration, isWarning } = notificationQueue.shift();

    const notification = document.createElement('div');
    notification.className = `notification ${isWarning ? 'warning' : ''}`;
    notification.innerHTML = `
        ${isWarning ? '<i class="fas fa-exclamation-triangle"></i>' : ''}
        <span>${message}</span>
    `;
    document.body.appendChild(notification);

    // Stok uyarısı için varsayılan bildirim sesi
    if (isWarning) {
        try {
            // Notification API kullanarak varsayılan sistem sesi
            if (Notification.permission === "granted") {
                new Notification("Stok Uyarısı", {
                    body: message,
                    silent: false // Varsayılan sistem sesini kullanmak için
                });
            } else if (Notification.permission !== "denied") {
                Notification.requestPermission().then(permission => {
                    if (permission === "granted") {
                        new Notification("Stok Uyarısı", {
                            body: message,
                            silent: false
                        });
                    }
                });
            }
        } catch (error) {
            // Fallback: Basit bir bip sesi
            const audio = new Audio('data:audio/wav;base64,UklGRngGAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQGAABBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWltcXV5fYGFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6e3x9fn+AgYKDhIWGh4iJiouMjY6PkJGSk5SVlpeYmZqbnJ2en6ChoqOkpaanqKmqq6ytrq+wsbKztLW2t7i5uru8vb6/wMHCw8TFxsfIycrLzM3Oz9DR0tPU1dbX2Nna29zd3t/g4eLj5OXm5+jp6uvs7e7v8PHy8/T19vf4+fr7/P3+/w==');
            audio.play().catch(e => console.log('Ses çalınamadı'));
        }
    }

    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.remove();
            showNextNotification();
        }, 300);
    }, duration);
}

// Onay kutusu göster
function confirmRemoval(callback) {
    if (confirm("Bu ürünü sepetinizden çıkarmak istediğinize emin misiniz?")) {
        callback(true);
    } else {
        callback(false);
    }
}

// localStorage değişikliklerini dinle
window.addEventListener('storage', function(e) {
    if (e.key === 'publicProducts') {
        // Ürünleri güncelle
        products = JSON.parse(e.newValue);
        // Sayfayı yeniden yükle
        loadProducts();
    }
});

// Sepete ürün ekle (stok kontrolü ile)
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const cartItem = cart.find(item => item.id === productId);

    if (!product) return;

    if (product.stock <= 0) {
        showNotification(
            `⚠️ ${product.name} şu anda stokta yok!\nHazırlanması uzun sürebilir fakat yine de sipariş verebilirsiniz.`, 
            7000, 
            true
        );
    }

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
    if (cart.length === 0) {
        showNotification('Sepetiniz boş!');
        return;
    }

    // WhatsApp numarasını localStorage'dan al
    const phoneNumber = localStorage.getItem('whatsappNumber') || '5523396844';
    let message = "Yeni Sipariş:%0A";
    let stockUpdated = false;
    
    // Stokları güncelle ve mesajı oluştur
    cart.forEach(item => {
        message += `${item.name} x ${item.quantity} = ${item.price * item.quantity} TL%0A`;
        
        // Stok güncellemesi
        const productIndex = products.findIndex(p => p.id === item.id);
        if (productIndex !== -1) {
            const currentStock = products[productIndex].stock;
            // Stok kontrolü ve güncelleme
            if (currentStock > 0) {
                products[productIndex].stock = Math.max(0, currentStock - item.quantity);
                stockUpdated = true;
            }
        }
    });
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    message += `%0AToplam: ${total} TL`;

    try {
        // Güncellenmiş stokları kaydet
        localStorage.setItem('publicProducts', JSON.stringify(products));
        localStorage.setItem('products', JSON.stringify(products));
        
        // Storage event'ini manuel tetikle
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'publicProducts',
            newValue: JSON.stringify(products)
        }));

        // WhatsApp siparişini aç
        window.open(`https://wa.me/90${phoneNumber}?text=${message}`);
        
        // Sepeti temizle
        cart = [];
        saveCartToStorage();
        
        // UI'ı güncelle
        updateCart();
        loadProducts(); // Stok göstergelerini güncelle
        
        showNotification('Siparişiniz başarıyla gönderildi ve stoklar güncellendi!');
        
        // Sepet panelini kapat
        const cartPanel = document.getElementById('cart');
        if (cartPanel.classList.contains('active')) {
            toggleCart();
        }
    } catch (error) {
        console.error('Stok güncelleme hatası:', error);
        showNotification('Sipariş gönderildi fakat stok güncellemesi başarısız oldu!', 5000, true);
    }
}

// Sepeti temizle
function clearCart() {
    if (cart.length === 0) {
        showNotification('Sepetiniz zaten boş!');
        return;
    }

    if (confirm('Sepetinizi tamamen boşaltmak istediğinize emin misiniz?')) {
        // Son sepet durumunu sakla (geri alma için)
        lastRemovedCart = [...cart];
        
        // Sepeti temizle
        cart = [];
        saveCartToStorage();
        updateCart();
        
        // Tüm ürün miktarlarını sıfırla
        products.forEach(product => {
            updateQuantityDisplay(product.id);
        });
        
        // Geri alma butonu ile bildirim göster
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <span>Sepetiniz temizlendi</span>
            <button onclick="undoCartClear()" class="undo-button">
                <i class="fas fa-undo"></i> İşlemi Geri Al
            </button>
        `;
        document.body.appendChild(notification);

        // Bildirimi belirli süre sonra kaldır
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
        
        // Sepet panelini kapat
        const cartPanel = document.getElementById('cart');
        if (cartPanel.classList.contains('active')) {
            toggleCart();
        }
    }
}

// Sepeti geri yükle (opsiyonel)
function undoCartClear() {
    if (lastRemovedCart) {
        cart = [...lastRemovedCart];
        lastRemovedCart = null;
        saveCartToStorage();
        updateCart();
        products.forEach(product => {
            updateQuantityDisplay(product.id);
        });
        showNotification('Sepetiniz geri yüklendi');
    }
}

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    updateCart();
    
    // Safari ve mobil tarayıcılar için dokunma olayı desteği
    document.body.addEventListener('touchstart', function(){}, {passive: true});
});

// Admin giriş modalını göster
function showLoginModal() {
    const modal = document.getElementById('loginModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Arka planı kaydırmayı engelle
}

// Admin giriş modalını kapat
function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    modal.classList.remove('active');
    document.body.style.overflow = ''; // Arka plan kaydırmayı tekrar etkinleştir
    // Form alanlarını temizle
    document.getElementById('loginForm').reset();
}

// Admin girişini kontrol et
function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Örnek kullanıcı adı ve şifre kontrolü
    if (username === 'admin' && password === 'pari1234') {
        // Başarılı giriş
        showNotification('Giriş başarılı! Yönlendiriliyorsunuz...');
        setTimeout(() => {
            window.location.href = 'admin.html';
        }, 1000);
    } else {
        // Başarısız giriş
        showNotification('Kullanıcı adı veya şifre hatalı!', 3000, true);
    }
}

// Modalın dışına tıklandığında kapatma
window.onclick = function(event) {
    const modal = document.getElementById('loginModal');
    if (event.target === modal) {
        closeLoginModal();
    }
}

// ESC tuşu ile modalı kapatma
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeLoginModal();
    }
});