// --- AYARLAR ---
const SHIPPING_SETTINGS = {
    "Robotistan": { fee: 83.99, threshold: 1500.0 },
    "Direnc.net": { fee: 144.0, threshold: 1500.0 },
    "Motorobit":  { fee: 137.0, threshold: 2500.0 },
    "Robo90":     { fee: 99.99, threshold: 1500.0 },
    "robolinkmarket":   { fee: 99.90, threshold: 1500.0 }

};

// --- KALICI HAFIZA (LOCAL STORAGE) YÖNETİMİ ---
// Sayfa ilk açıldığında tarayıcının hafızasına bakar. Sepet varsa çeker, yoksa boş başlatır.
let cart = JSON.parse(localStorage.getItem('makerRadarCart')) || [];

// Sayfa her yüklendiğinde sepet arayüzünü otomatik olarak çiz! (Sayfa yenilendiğinde boş gelmesini engeller)
window.onload = () => {
    updateCartUI();
};

// Sepette en ufak bir değişiklik olduğunda bunu tarayıcının harddiskine (kalıcı olarak) kaydeder.
function saveCart() {
    localStorage.setItem('makerRadarCart', JSON.stringify(cart));
}
// ----------------------------------------------

// Sekme Değiştirme Animasyonu
function switchTab(tabId, btnElement) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    if(btnElement) btnElement.classList.add('active');
}

// API'ye İstek Atma
async function searchProducts() {
    const query = document.getElementById('searchInput').value;
    if (!query) return;

    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('resultsGrid').innerHTML = '';

    try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        renderResults(data);
    } catch (error) {
        console.error("Arama hatası:", error);
        alert("Ürünler çekilirken bir hata oluştu.");
    } finally {
        document.getElementById('loading').classList.add('hidden');
    }
}

// Ürün Kartlarını Çizme
function renderResults(products) {
    const grid = document.getElementById('resultsGrid');
    if (products.length === 0) {
        grid.innerHTML = '<p>Sonuç bulunamadı.</p>';
        return;
    }

    products.forEach(p => {
        const price = p['Fiyat'].toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const imgTag = p['Görsel'] ? `<img src="${p['Görsel']}" referrerpolicy="no-referrer" alt="Ürün Görseli">` : `<div style="height:200px; background:#eee; margin-bottom:15px; border-radius:8px; line-height:200px;">Görsel Yok</div>`;
        
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            ${imgTag}
            <h3>${p['Ürün']}</h3>
            <p>🏢 Satıcı: <b>${p['Site']}</b></p>
            <div class="price">${price} TL</div>
            <div class="card-actions">
                <button class="btn-add" onclick='addToCart(${JSON.stringify(p).replace(/'/g, "&#39;")})'>Sepete Ekle ➕</button>
                <a href="${p['Link']}" target="_blank" class="btn-go">Mağazaya Git</a>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Sepete Ekleme ve Toast Bildirimi
function addToCart(product) {
    cart.push({
        aktif: true,
        adet: 1,
        ...product
    });
    saveCart(); // <--- EKLENDİĞİ AN KAYDET
    updateCartUI();
    showToast(`${product['Ürün']} tezgahına eklendi! ✅`);
}

function showToast(message) {
    const oldToast = document.getElementById("toast");
    if(oldToast) oldToast.remove();

    const toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    toast.innerText = message;
    document.body.appendChild(toast);
    
    setTimeout(() => { toast.classList.add("show"); }, 10);
    setTimeout(() => { toast.classList.remove("show"); }, 3000);
}

// Sepeti Çizme ve Hesaplama
function updateCartUI() {
    document.getElementById('cartCount').innerText = cart.length;
    
    if (cart.length === 0) {
        document.getElementById('emptyCart').classList.remove('hidden');
        document.getElementById('cartContent').classList.add('hidden');
        return;
    }

    document.getElementById('emptyCart').classList.add('hidden');
    document.getElementById('cartContent').classList.remove('hidden');

    const tbody = document.getElementById('cartTableBody');
    tbody.innerHTML = '';

    cart.forEach((item, index) => {
        const price = item['Fiyat'].toLocaleString('tr-TR', { minimumFractionDigits: 2 });
        const tr = document.createElement('tr');
        tr.style.opacity = item.aktif ? "1" : "0.5";
        
        tr.innerHTML = `
            <td><input type="checkbox" ${item.aktif ? 'checked' : ''} onchange="updateItem(${index}, 'aktif', this.checked)"></td>
            <td><img src="${item['Görsel']}" referrerpolicy="no-referrer"></td>
            <td style="text-align:left;">${item['Ürün']}</td>
            <td><b>${item['Site']}</b></td>
            <td>${price} TL</td>
            <td><input type="number" min="1" value="${item.adet}" onchange="updateItem(${index}, 'adet', parseInt(this.value))"></td>
            <td>
                <a href="${item['Link']}" target="_blank" style="margin-right:10px;"><i class="fas fa-external-link-alt" style="color:var(--primary);"></i></a>
                <button class="btn-delete" onclick="removeItem(${index})"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    calculateTotals();
}

// Ürün Güncellendiğinde
function updateItem(index, field, value) {
    cart[index][field] = value;
    saveCart(); // <--- GÜNCELLENDİĞİ AN KAYDET
    updateCartUI(); 
}

// Ürün Silindiğinde
function removeItem(index) {
    cart.splice(index, 1);
    saveCart(); // <--- SİLİNDİĞİ AN KAYDET
    updateCartUI();
}

// Akıllı Kargo Matematiği
function calculateTotals() {
    let grandTotal = 0;
    const shippingGrid = document.getElementById('shippingCards');
    shippingGrid.innerHTML = '';

    const activeItems = cart.filter(item => item.aktif);

    for (const [siteName, settings] of Object.entries(SHIPPING_SETTINGS)) {
        const siteItems = activeItems.filter(item => item['Site'] === siteName);
        
        if (siteItems.length > 0) {
            let productTotal = 0;
            siteItems.forEach(item => { productTotal += (item['Fiyat'] * item.adet); });

            let shippingFee = 0;
            let shippingMsg = "";

            if (productTotal >= settings.threshold) {
                shippingFee = 0;
                shippingMsg = "<span style='color:#28a745;'><i class='fas fa-check-circle'></i> Kargo Bedava!</span>";
            } else {
                shippingFee = settings.fee;
                const fark = settings.threshold - productTotal;
                shippingMsg = `<span style='color:#dc3545;'><i class='fas fa-exclamation-triangle'></i> Kargo: ${shippingFee} TL <br><small>(Bedavaya ${fark.toLocaleString('tr-TR')} TL kaldı)</small></span>`;
            }

            const siteSubTotal = productTotal + shippingFee;
            grandTotal += siteSubTotal;

            const card = document.createElement('div');
            card.className = 'shipping-card';
            card.innerHTML = `
                <h4>📦 ${siteName}</h4>
                <p>Ürünler: <b>${productTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</b></p>
                <p>${shippingMsg}</p>
                <div class="total">Ara Toplam: ${siteSubTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</div>
            `;
            shippingGrid.appendChild(card);
        }
    }
    document.getElementById('grandTotal').innerText = grandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 });
}

// Excel (CSV) İndirme
function downloadCSV() {
    const activeItems = cart.filter(item => item.aktif);
    if(activeItems.length === 0) { alert("İndirilecek aktif ürün yok!"); return; }

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; 
    csvContent += "Urun,Satici,Fiyat_TL,Adet,Link\n"; 

    activeItems.forEach(item => {
        let name = item['Ürün'].replace(/"/g, '""');
        if(name.indexOf(',') > -1) name = `"${name}"`;
        let row = `${name},${item['Site']},${item['Fiyat']},${item.adet},${item['Link']}`;
        csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "bom_listem.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}