<img src="assets/icon.svg" width="64" height="64" alt="">

# iPhone2Android

Samsung telefon ve tabletlerden iPhone ekranına erişme hedefiyle geliştirilen deneysel proje.

Site: https://iphone2android-sait.ibrahimsait.chatgpt.site

## Mevcut sürüm

- QR kodu ile süreli, rastgele anahtarlı oturum eşleştirme.
- İki cihazda doğrulama kodu ve alıcı onayı.
- Destekleyen tarayıcılarda WebRTC ekran aktarımı.
- Ana ekrana eklenebilen web uygulaması manifesti.
- Bağlantı kesilmesi, reddedilen izinler ve desteklenmeyen cihazlar için durum yönetimi.

Bu sürüm iPhone uzaktan kontrolü içermez. iOS tarayıcısında ekran yakalama yoksa bunu açıkça bildirir; kamera veya örnek görüntüyü telefon ekranı olarak göstermez. Native iOS ReplayKit yayın uygulaması ve Android Bluetooth HID kontrol uygulaması henüz uygulanmadı.

PeerJS Cloud yalnızca bağlantı sinyalleşmesi için kullanılır. Medya WebRTC üzerinden taşınır. TURN sunucusu yapılandırılmadığı için bazı ağlarda bağlantı kurulamayabilir. Aynı Wi-Fi ağı önerilir. Yayınlanan Sites sürümü sahip hesabına özeldir.

## Geliştirme

```sh
cd web
npm ci
npm test
npm run build
npx playwright test
```

Tarayıcı testleri yerel Chrome kurulumunu kullanır. Eşleştirme gerçek PeerJS bağlantısıyla doğrulanır; medya testinde açıkça test için üretilen canvas akışı kullanılır. Bu test fiziksel iPhone veya Samsung doğrulaması değildir.
