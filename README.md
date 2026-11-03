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

PeerJS Cloud yalnızca bağlantı sinyalleşmesi için kullanılır. Medya WebRTC üzerinden taşınır. PeerJS’in varsayılan STUN/TURN yapılandırması kullanılır. Varsayılan TURN sunucularının DNS çözümlemesi testte başarısız oldu. WebKit–Chromium eşleştirmesi bir denemede başarısız, sonraki yerel denemede başarılı oldu; farklı ağlarda çalışma garantisi yoktur. Kullanıcının tercihiyle ek servis kurulumu durduruldu ve aynı Wi-Fi kullanımına odaklanıldı. Aynı Wi-Fi ağı önerilir. Web uygulaması Vercel üzerinde yayınlanır.

## Geliştirme

```sh
cd web
npm ci
npm test
npm run build
npx playwright test
```

Tarayıcı testleri yerel Chrome kurulumunu kullanır. WebKit regresyon testi için önce `npx playwright install webkit` çalıştırılır; bu test gerçek WebKit–Chromium eşleştirmesini kontrol eder. Fiziksel iPhone–Samsung testi değildir. Eşleştirme gerçek PeerJS bağlantısıyla doğrulanır; medya testinde açıkça test için üretilen canvas akışı kullanılır. Bu test fiziksel iPhone veya Samsung doğrulaması değildir.
