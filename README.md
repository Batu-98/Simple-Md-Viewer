# 📄 Markdown Viewer & PDF

Yerel olarak çalışan, bilgisayarınızdaki `.md` (Markdown) dosyalarını modern ve şık bir arayüzle görüntülemenizi, düzenlemenizi ve **A4 boyutunda piksel hassasiyetinde vektörel PDF** olarak kaydetmenizi sağlayan web tabanlı Markdown görüntüleyici.

---

## 🎯 .md Dosyalarını Otomatik / Varsayılan Yapma

Bilgisayarınızdaki herhangi bir `.md` dosyasına çift tıkladığınızda doğrudan bu görüntüleyicide açılmasını sağlamak için 2 pratik yöntem hazırlanmıştır:

### 1. Yöntem: Otomatik Kurulum (1 Tıkla)
Klasördeki **`varsayilan-yap.bat`** dosyasına çift tıklayın.
* Windows Kayıt Defterine (Registry) kullanıcı düzeyinde güvenle kaydedilir (Yönetici izni istemez).
* Hem varsayılan açma ayarı yapılır hem de sağ tık menünüze **"Markdown Viewer ile Aç"** seçeneği eklenir.
* Ayarları geri almak isterseniz dilediğiniz zaman **`varsayilani-kaldir.bat`** dosyasını çalıştırmanız yeterlidir.

### 2. Yöntem: Windows Arayüzünden Manuel Seçme
1. Bilgisayarınızdaki herhangi bir `.md` dosyasına sağ tıklayın.
2. **Birlikte Aç (Open with)** > **Başka bir uygulama seç** yolunu izleyin.
3. *"Bu bilgisayarda başka bir uygulama arayın"* seçeneğine tıklayın.
4. Bu klasördeki **`mdviewer.exe`** dosyasını seçin.
5. **"Her zaman bu uygulamayı kullan"** kutucuğunu işaretleyin.

---

## ⚡ Hızlı Başlangıç

Bu uygulama **sıfır harici bağımlılık** ile çalışır (`npm install` yapmanıza gerek yoktur).

### 1. Yöntem: Çift Tıklayarak Başlatma (En Kolayı)
Klasördeki **`start.bat`** dosyasına çift tıklayın.
- Yerel sunucu otomatik olarak başlar.
- Varsayılan internet tarayıcınızda `http://localhost:3000` adresi otomatik açılır.

### 2. Yöntem: Komut Satırından Başlatma
```bash
node server.js
# veya
npm start
```

### 3. Yöntem: Sunucusuz Doğrudan Açma
İsterseniz hiçbir komut çalıştırmadan doğrudan **`index.html`** dosyasına çift tıklayarak da tarayıcınızda kullanabilirsiniz.

---

## 🌟 Öne Çıkan Özellikler

### 1. 📂 Dosya ve Klasör Yönetimi
- **Dosya Aç (Ctrl + O):** Bilgisayarınızdan dilediğiniz `.md` veya `.txt` dosyasını seçin.
- **Klasör Aç:** Bir not klasörünü seçtiğinizde sol kenar çubuğunda tüm `.md` dosyaları listelenir; dosyalar arasında tek tıkla geçiş yapabilirsiniz.
- **Sürükle & Bırak:** Markdown dosyasını doğrudan tarayıcı penceresine sürükleyip bırakmanız yeterlidir.

### 2. 🖨️ Yüksek Kaliteli Vektörel PDF Çıktısı (Ctrl + P)
- Tarayıcının yerleşik yazdırma motoru (`@media print`) kullanılarak **%100 vektörel, keskin ve kristal netliğinde** PDF üretilir.
- **A4 Sayfa Boyutlandırması:** Kenar boşlukları, yazı boyutları ve satır aralıkları A4 standartlarına optimize edilmiştir.
- **Bölünmeyi Önleme (Page-Break Protection):** Tabloların, kod bloklarının ve görsellerin sayfa ortasında çirkin şekilde ikiye bölünmesi otomatik engellenir.
- **Manuel Sayfa Sonu:** Dökümanınızda yeni bir sayfaya geçmek istediğiniz yere `<!-- pagebreak -->` eklemeniz yeterlidir.

### 3. 🎨 Görünüm ve Düzen Seçenekleri
- **A4 Kağıt Modu:** Dökümanın yazıcıdan çıktığında nasıl görüneceğini ekranda A4 kağıt formunda gösterir.
- **Çoklu Görünüm Modları:**
  - *Sadece Önizleme:* Temiz bir okuma deneyimi.
  - *Bölünmüş Ekran (Split View):* Sol tarafta kaynak Markdown kodu, sağ tarafta anlık canlı önizleme.
  - *Sadece Düzenleyici:* Hızlı metin düzenleme.
- **Temalar:** Açık (GitHub), Koyu (Dark Mode) ve Göz Yormayan Sepya modu.

### 4. 🚀 Zengin İçerik Desteği
- **Mermaid.js Diyagramları:** Akış şemaları (`flowchart`), sıralama diyagramları (`sequenceDiagram`), mimari şemalar.
- **KaTeX Matematik Desteği:** Satır içi (`$E=mc^2$`) ve blok (`$$\int e^x dx$$`) matematiksel ve fiziksel formüller.
- **Kod Renklendirme:** Highlight.js ile tüm dillerde sözdizimi vurgulama ve tek tıkla kopyalama butonu.
- **GitHub Callout Kutuları:** `[!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, `[!CAUTION]`.
- **Otomatik İçindekiler (TOC):** Başlıklara göre sol menüde otomatik hiyerarşik içindekiler tablosu ve tek tıkla başlığa kaydırma.
- **İstatistikler:** Kelime, karakter sayısı, tahmini okuma süresi ve sayfa sayısı.

---

## 💡 PDF Çıktısı Alırken İpucu

"PDF Kaydet" butonuna (veya `Ctrl + P`) bastığınızda tarayıcınızın yazdırma penceresi açılır:
1. **Hedef:** "PDF Olarak Kaydet" (Save as PDF) seçin.
2. **Düzen:** Dikey (Portrait).
3. **Diğer Ayarlar > Arka plan grafikleri:** **Açık (İşaretli)** olduğundan emin olun (renkli kod blokları ve tabloların renklerinin PDF'e geçmesi için).
