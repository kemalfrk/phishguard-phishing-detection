# 🛡️ PhishGuard — Makine Öğrenmesi ile Oltalama Web Sitesi Tespiti
 
> UCI Phishing Websites veri seti üzerinde 7 farklı makine öğrenmesi algoritması kullanılarak geliştirilmiş, Flask tabanlı web arayüzüne sahip oltalama (phishing) tespit sistemi.
 
---
 
## 📊 Proje Özeti
 
Bu proje, internet kullanıcılarını oltalama (phishing) saldırılarından korumak amacıyla geliştirilmiştir. 11.055 web sitesine ait 30 farklı özellik (URL yapısı, SSL sertifikası, alan adı yaşı vb.) analiz edilerek web sitelerinin meşru mu yoksa oltalama mı olduğu otomatik olarak tespit edilmektedir.
 
### 🏆 En İyi Model Sonuçları
 
| Model | Doğruluk (Accuracy) | F1-Skoru |
|-------|-------------------|----------|
| **XGBoost** ⭐ | **%97.74** | **%97.71** |
| SVM | %97.65 | %97.60 |
| Yapay Sinir Ağı (ANN) | %97.20 | %97.14 |
| Random Forest | %97.02 | %96.96 |
| KNN | %96.65 | %96.59 |
| Karar Ağacı | %96.56 | %96.50 |
| Lojistik Regresyon | %93.13 | %92.99 |
 
---
 
## 📁 Proje Yapısı
 
```
Phishing_Website_Proje/
│
├── main.ipynb                          # Tüm model eğitimi, analiz ve görselleştirmeler
├── server.py                           # Flask API sunucusu
├── app.js                              # Frontend JavaScript
├── index.html                          # Web arayüzü
├── style.css                           # Arayüz stilleri
│
├── Training Dataset.arff               # UCI Phishing Websites veri seti
├── Phishing Websites Features.docx     # Özellik açıklamaları
├── requirements.txt                    # Python bağımlılıkları
│
├── en_iyi_xgboost_modeli.pkl           # Eğitilmiş XGBoost modeli
├── en_iyi_random_forest_modeli.pkl     # Eğitilmiş Random Forest modeli
├── en_iyi_svm_modeli.pkl               # Eğitilmiş SVM modeli
├── en_iyi_ann_modeli.pkl               # Eğitilmiş ANN modeli
├── en_iyi_knn_modeli.pkl               # Eğitilmiş KNN modeli
├── en_iyi_karar_agaci_modeli.pkl       # Eğitilmiş Karar Ağacı modeli
└── en_iyi_lojistik_regresyon_modeli.pkl# Eğitilmiş Lojistik Regresyon modeli
```
 
---
 
## 🚀 Kurulum ve Çalıştırma
 
### Gereksinimler
 
- Python 3.8+
- pip
### 1. Repoyu klonlayın
 
```bash
git clone https://github.com/kemalfrk/phishguard-phishing-detection.git
cd phishguard-phishing-detection
```
 
### 2. Bağımlılıkları yükleyin
 
```bash
pip install -r requirements.txt
```
 
### 3. Sunucuyu başlatın
 
```bash
python server.py
```
 
### 4. Tarayıcıdan açın
 
```
http://localhost:5000
```
 
Web arayüzüne bir URL girerek o sitenin oltalama mı yoksa meşru mu olduğunu anında öğrenebilirsiniz.
 
---
 
## 🔬 Kullanılan Teknolojiler
 
### Makine Öğrenmesi
- `scikit-learn` — Lojistik Regresyon, Karar Ağacı, Random Forest, KNN, SVM, ANN
- `xgboost` — XGBoost
- `GridSearchCV / RandomizedSearchCV` — Hiperparametre optimizasyonu
- `joblib` — Model kaydetme/yükleme
### Backend
- `Flask` — REST API sunucusu
- `flask-cors` — CORS desteği
### Veri İşleme
- `pandas` — Veri manipülasyonu
- `numpy` — Sayısal hesaplama
- `scipy` — .arff veri seti okuma
---
 
## 🧠 Veri Seti
 
**UCI Phishing Websites Dataset**
 
- **Kaynak:** [UCI Machine Learning Repository](https://archive.ics.uci.edu/ml/datasets/phishing+websites)
- **Toplam örnek:** 11.055 web sitesi (6.157 meşru, 4.898 oltalama)
- **Özellik sayısı:** 30 bağımsız değişken + 1 hedef değişken
- **Özellik türleri:** URL tabanlı, sayfa içeriği, alan adı ve güvenlik özellikleri
### Öne Çıkan Özellikler
 
| Özellik | Açıklama |
|---------|----------|
| `SSLfinal_State` | SSL sertifika durumu ve güvenilirliği |
| `URL_of_Anchor` | Köprü bağlantılarının farklı sitelere yönlendirme oranı |
| `web_traffic` | Alexa trafik sıralaması |
| `having_Sub_Domain` | Alt alan adı sayısı |
| `URL_Length` | URL karakter uzunluğu |
 
---
 
## 📈 Model Detayları
 
### Hiperparametre Optimizasyonu
 
Her model, varsayılan parametrelerle eğitildikten sonra aşağıdaki yöntemlerle optimize edilmiştir:
 
- **GridSearchCV** (5 katlı çapraz doğrulama) → Lojistik Regresyon, Karar Ağacı, Random Forest, KNN, SVM, XGBoost
- **RandomizedSearchCV** → Yapay Sinir Ağı (kombinasyon sayısı fazla olduğu için)
### Özellik Önemi
 
Analizler sonucunda en belirleyici özellikler:
 
1. 🥇 `SSLfinal_State` — SSL sertifika durumu
2. 🥈 `URL_of_Anchor` — Bağlantı yönlendirme oranı
3. 🥉 `web_traffic` — Web trafik hacmi
### Aşırı Öğrenme (Overfitting) Kontrolü
 
ANN modelinin kayıp eğrisi (Loss Curve) analizi, eğitim ve doğrulama kayıplarının birbirine paralel azaldığını göstermiş; sistemin yeni (zero-day) oltalama sitelerine karşı da yüksek genelleme yeteneğine sahip olduğu doğrulanmıştır.
 
---
 
## 🌐 Web Arayüzü
 
Flask tabanlı web arayüzü aracılığıyla:
 
- Herhangi bir URL girilip **anlık oltalama analizi** yapılabilir
- Tüm 7 model arasından seçim yapılabilir
- Sonuç: **Meşru ✅** veya **Oltalama ⚠️**
---
 
## 👥 Katkıda Bulunanlar
 
| İsim | Kurum |
|------|-------|
| Yiğit Mert Demir | Gazi Üniversitesi, Bilgisayar Mühendisliği |
| Kemal Faruk Talay | Gazi Üniversitesi, Bilgisayar Mühendisliği |
 
---
 
## 📄 Lisans
 
Bu proje akademik amaçlı geliştirilmiştir. Kaynak göstererek kullanılabilir.
 
---
 
## 📚 Referans Makale
 
Bu repo, aşağıdaki akademik çalışmanın kod tabanını içermektedir:
 
> Demir, Y. M. & Talay, K. F. (2025). *PhishGuard: Makine Öğrenmesi Algoritmaları ile Oltalama Web Sitesi Tespiti.* Gazi Üniversitesi, Fen Bilimleri Enstitüsü.
