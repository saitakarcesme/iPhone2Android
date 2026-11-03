<img src="assets/icon.svg" width="64" height="64" alt="">

# iPhone2Android

Samsung telefon ve tabletlerden iPhone ekranına erişme hedefiyle geliştirilen deneysel proje.

Site: https://iphone2android-ibrahimsait2023-projects.vercel.app

## Mevcut sürüm

- QR kodu ile süreli, rastgele anahtarlı oturum eşleştirme.
- İki cihazda doğrulama kodu ve alıcı onayı.
- Destekleyen tarayıcılarda WebRTC ekran aktarımı.
- Ana ekrana eklenebilen web uygulaması manifesti.
- Bağlantı kesilmesi, reddedilen izinler ve desteklenmeyen cihazlar için durum yönetimi.

Bu sürüm iPhone uzaktan kontrolü içermez. iOS tarayıcısında ekran yakalama yoksa bunu açıkça bildirir; kamera veya örnek görüntüyü telefon ekranı olarak göstermez. Native iOS ReplayKit yayın uygulaması ve Android Bluetooth HID kontrol uygulaması henüz uygulanmadı.

PeerJS Cloud yalnızca bağlantı sinyalleşmesi için kullanılır. Medya WebRTC üzerinden taşınır. PeerJS’in varsayılan STUN/TURN yapılandırması kullanılır. Son testte varsayılan TURN sunucularının DNS çözümlemesi başarısız oldu; WebKit–Chromium eşleştirmesi de başarısız olarak yeniden üretildi. Bu bağlantı sorunu henüz çözülmedi. HTTPS üzerinden eşleştirme için ücretsiz Upstash kurulumu, Vercel’de hesap sahibinin Marketplace koşullarını kabul etmesini bekliyor. Aynı Wi-Fi ağı önerilir. Web uygulaması Vercel üzerinde yayınlanır.

## Geliştirme

```sh
cd web
npm ci
npm test
npm run build
npx playwright test
```

Tarayıcı testleri yerel Chrome kurulumunu kullanır. WebKit regresyon testi için önce `npx playwright install webkit` çalıştırılır; bu test bilinen başarısızlık olarak işaretlidir. Eşleştirme gerçek PeerJS bağlantısıyla doğrulanır; medya testinde açıkça test için üretilen canvas akışı kullanılır. Bu test fiziksel iPhone veya Samsung doğrulaması değildir.
