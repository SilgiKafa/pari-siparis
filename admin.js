// Admin paneli için ürün yönetimi
let products = JSON.parse(localStorage.getItem('products')) || [
    { id: 1, name: "SARIMSAKLI EKMEK", price: 75, stock: 10, image: "https://images.unsplash.com/photo-1573821663912-569905455b1c?w=500" },
    { id: 2, name: "MARGHERİTA", price: 100, stock: 15, image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500" },
    // ... diğer ürünler
];

let cropper = null;

// WhatsApp numarasını localStorage'dan al
let whatsappNumber = localStorage.getItem('whatsappNumber') || '5523396844';

// Ürünleri yükle
function loadProducts() {
    const container = document.querySelector('.products-grid');
    container.innerHTML = '';

    products.forEach(product => {
        const card = document.createElement('div');
        card.className = `product-card ${product.active === false ? 'inactive' : ''}`;
        card.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <h3>${product.name}</h3>
                <p>${product.price} TL</p>
                <p class="stock-info">Stok: ${product.stock}</p>
                <button onclick="editProduct(${product.id})" class="edit-btn">
                    <i class="fas fa-edit"></i> Düzenle
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

// Ürün düzenleme modalını aç
function editProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    document.getElementById('editId').value = product.id;
    document.getElementById('editName').value = product.name;
    document.getElementById('editPrice').value = product.price;
    document.getElementById('editStock').value = product.stock;
    document.getElementById('editActive').checked = product.active !== false;

    // Görsel önizleme
    const preview = document.querySelector('.image-preview');
    preview.innerHTML = `<img src="${product.image}" alt="Önizleme">`;

    document.getElementById('editModal').style.display = 'block';
}

// Modalı kapat
function closeModal() {
    document.getElementById('editModal').style.display = 'none';
}

// Değişiklikleri kaydet ve public ile senkronize et
async function saveChanges() {
    const saveBtn = document.querySelector('.save-all-btn');
    saveBtn.classList.add('saving');
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Kaydediliyor...';

    try {
        // Önce admin panelindeki ürünleri kaydet
        localStorage.setItem('products', JSON.stringify(products));
        
        // Sonra public ürünleri güncelle
        localStorage.setItem('publicProducts', JSON.stringify(products));
        
        // localStorage event'ini manuel tetikle
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'publicProducts',
            newValue: JSON.stringify(products)
        }));
        
        showAdminNotification('Değişiklikler başarıyla kaydedildi!', 'success');
    } catch (error) {
        showAdminNotification('Kaydetme sırasında bir hata oluştu!', 'error');
        console.error('Kaydetme hatası:', error);
    } finally {
        saveBtn.classList.remove('saving');
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Değişiklikleri Kaydet';
    }
}

// Admin bildirimlerini göster
function showAdminNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `admin-notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Yeni ürün ekleme fonksiyonu
function addNewProduct() {
    const newProduct = {
        id: Date.now(), // Benzersiz ID
        name: "Yeni Ürün",
        price: 0,
        stock: 0,
        image: "default.jpg",
        active: true
    };
    
    products.push(newProduct);
    editProduct(newProduct.id);
    loadProducts();
}

// Görsel yükleme işlemi
document.getElementById('editImageFile').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            openCropperModal(e.target.result);
        };
        reader.readAsDataURL(file);
    }
});

// Cropper modalını aç
function openCropperModal(imageUrl) {
    const modal = document.getElementById('cropperModal');
    const image = document.getElementById('cropperImage');
    
    image.src = imageUrl;
    modal.style.display = 'block';
    
    // Varsa önceki cropper'ı temizle
    if (cropper) {
        cropper.destroy();
    }
    
    // Yeni cropper başlat
    cropper = new Cropper(image, {
        aspectRatio: 1, // 1:1 kare oran
        viewMode: 2,
        dragMode: 'move',
        autoCropArea: 1,
        restore: false,
        guides: true,
        center: true,
        highlight: false,
        cropBoxMovable: true,
        cropBoxResizable: true,
        toggleDragModeOnDblclick: false
    });
}

// Görsel döndürme
function rotateImage(degree) {
    if (cropper) {
        cropper.rotate(degree);
    }
}

// Yakınlaştırma/Uzaklaştırma
function zoomImage(ratio) {
    if (cropper) {
        cropper.zoom(ratio);
    }
}

// Kırpma işlemini uygula
function applyCrop() {
    if (cropper) {
        const croppedCanvas = cropper.getCroppedCanvas({
            width: 500,  // Maksimum genişlik
            height: 500, // Maksimum yükseklik
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high'
        });
        
        // Kırpılmış görseli önizleme alanına ekle
        const preview = document.querySelector('.image-preview');
        preview.innerHTML = `<img src="${croppedCanvas.toDataURL('image/jpeg', 0.8)}" alt="Önizleme">`;
        preview.dataset.base64 = croppedCanvas.toDataURL('image/jpeg', 0.8);
        
        closeCropperModal();
    }
}

// Cropper modalını kapat
function closeCropperModal() {
    const modal = document.getElementById('cropperModal');
    modal.style.display = 'none';
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
}

// Form gönderimini işle
document.getElementById('editForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const id = parseInt(document.getElementById('editId').value);
    const name = document.getElementById('editName').value;
    const price = parseFloat(document.getElementById('editPrice').value);
    const stock = parseInt(document.getElementById('editStock').value);
    const active = document.getElementById('editActive').checked;
    
    // Yeni yüklenen görsel varsa onu kullan, yoksa mevcut görseli koru
    const preview = document.querySelector('.image-preview');
    const image = preview.dataset.base64 || products.find(p => p.id === id).image;

    // Ürünü güncelle
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
        products[index] = { ...products[index], name, price, stock, image, active };
        loadProducts();
        closeModal();
        showAdminNotification('Ürün güncellendi! Değişiklikleri kaydetmeyi unutmayın.', 'success');
    }
});

// Ürün silme fonksiyonu
function deleteProduct() {
    const id = parseInt(document.getElementById('editId').value);
    if (confirm('Bu ürünü silmek istediğinize emin misiniz?')) {
        products = products.filter(p => p.id !== id);
        loadProducts();
        closeModal();
        showAdminNotification('Ürün silindi! Değişiklikleri kaydetmeyi unutmayın.', 'success');
    }
}

// Güvenli çıkış fonksiyonu
function logout() {
    if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
        // Oturum verilerini temizle
        localStorage.removeItem('adminLoggedIn');
        sessionStorage.clear();
        
        showAdminNotification('Güvenli çıkış yapılıyor...');
        
        // Yapılmamış değişiklikleri kontrol et
        const hasUnsavedChanges = checkUnsavedChanges();
        
        if (hasUnsavedChanges) {
            if (confirm('Kaydedilmemiş değişiklikler var. Çıkmadan önce kaydetmek ister misiniz?')) {
                saveChanges().then(() => {
                    redirectToHome();
                });
                return;
            }
        }
        
        redirectToHome();
    }
}

// Ana sayfaya yönlendirme
function redirectToHome() {
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

// Kaydedilmemiş değişiklikleri kontrol et
function checkUnsavedChanges() {
    const currentProducts = JSON.stringify(products);
    const savedProducts = localStorage.getItem('products');
    return currentProducts !== savedProducts;
}

// Ayarlar modalını göster
function showSettings() {
    const modal = document.getElementById('settingsModal');
    const input = document.getElementById('whatsappNumber');
    
    // Mevcut numarayı göster
    input.value = whatsappNumber;
    
    modal.style.display = 'block';
}

// Ayarlar modalını kapat
function closeSettingsModal() {
    const modal = document.getElementById('settingsModal');
    modal.style.display = 'none';
}

// Ayarları kaydet
function saveSettings(event) {
    event.preventDefault();
    
    const newNumber = document.getElementById('whatsappNumber').value;
    const oldNumber = whatsappNumber;
    
    if (newNumber !== oldNumber) {
        // Numarayı güncelle
        whatsappNumber = newNumber;
        localStorage.setItem('whatsappNumber', newNumber);
        
        // Değişiklik uyarısı göster
        showNumberChangeAlert(oldNumber, newNumber);
        
        // Admin bildirimini göster
        showAdminNotification('WhatsApp numarası güncellendi!', 'success');
    }
    
    closeSettingsModal();
}

// Numara değişiklik uyarısı göster
function showNumberChangeAlert(oldNumber, newNumber) {
    const alert = document.createElement('div');
    alert.className = 'number-change-alert';
    alert.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        <div>
            <strong>WhatsApp numarası değiştirildi!</strong><br>
            Eski numara: +90${oldNumber}<br>
            Yeni numara: +90${newNumber}
        </div>
    `;
    
    document.querySelector('.admin-container').insertBefore(
        alert, 
        document.querySelector('.products-grid')
    );
    
    // 5 saniye sonra uyarıyı kaldır
    setTimeout(() => {
        alert.style.opacity = '0';
        setTimeout(() => alert.remove(), 300);
    }, 5000);
}

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    
    // Input formatlaması
    const phoneInput = document.getElementById('whatsappNumber');
    phoneInput.addEventListener('input', function(e) {
        // Sadece rakam girişine izin ver
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
        
        // 10 haneden fazla girişi engelle
        if (e.target.value.length > 10) {
            e.target.value = e.target.value.slice(0, 10);
        }
    });
}); 