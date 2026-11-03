export function captureErrorMessage(error) {
  switch (error?.name) {
    case 'NotAllowedError': return 'Ekran paylaşımına izin verilmedi veya seçim iptal edildi. Yeniden deneyebilirsin.';
    case 'NotSupportedError': return 'Bu tarayıcı ekran paylaşımını başlatmayı desteklemiyor. Bağlantı kurulsa da bu tarayıcıdan iPhone ekranı aktarılamaz.';
    case 'InvalidStateError': return 'Ekran paylaşımını başlatmak için bu sayfayı açık tutup düğmeye tekrar dokun.';
    case 'NotReadableError': return 'Tarayıcı seçilen ekranı okuyamadı. Ekran paylaşımını yeniden başlat.';
    default: return 'Ekran paylaşımı başlatılamadı. Hata kodu: ' + String(error?.name || 'unknown').replace(/[^a-zA-Z]/g, '').slice(0,48);
  }
}
