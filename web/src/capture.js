export function captureErrorMessage(error) {
  switch (error?.name) {
    case 'TimeoutError': return 'Tarayıcı paylaşım isteğine yanıt vermedi. Düğmeye dokunarak sayfayı yenileyip yeniden deneyebilirsin.';
    case 'NotAllowedError': return 'Ekran paylaşımına izin verilmedi veya seçim iptal edildi. Yeniden deneyebilirsin.';
    case 'NotSupportedError': return 'Bu tarayıcı ekran paylaşımını başlatmayı desteklemiyor. Bağlantı kurulsa da bu tarayıcıdan iPhone ekranı aktarılamaz.';
    case 'InvalidStateError': return 'Ekran paylaşımını başlatmak için bu sayfayı açık tutup düğmeye tekrar dokun.';
    case 'NotReadableError': return 'Tarayıcı seçilen ekranı okuyamadı. Ekran paylaşımını yeniden başlat.';
    default: return 'Ekran paylaşımı başlatılamadı. Hata kodu: ' + String(error?.name || 'unknown').replace(/[^a-zA-Z]/g, '').slice(0,48);
  }
}

// getDisplayMedia has no standard cancellation API. Bound our wait and stop any
// stream returned after timeout/navigation instead of leaving capture running.
export function requestScreenCapture(mediaDevices, { timeoutMs = 30000, signal } = {}) {
  if (signal?.aborted) return Promise.reject(new DOMException('Cancelled', 'AbortError'));
  let nativeRequest;
  try {
    nativeRequest = mediaDevices.getDisplayMedia({ video: { frameRate: { ideal: 30, max: 30 } }, audio: true });
  } catch (error) { return Promise.reject(error); }
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error, stream) => {
      if (settled) { stream?.getTracks().forEach(track => track.stop()); return; }
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      if (error) reject(error); else resolve(stream);
    };
    const abort = () => finish(new DOMException('Cancelled', 'AbortError'));
    const timer = setTimeout(() => finish(new DOMException('Screen capture did not respond', 'TimeoutError')), timeoutMs);
    signal?.addEventListener('abort', abort, { once: true });
    Promise.resolve(nativeRequest).then(stream => finish(null, stream), error => finish(error));
    if (signal?.aborted) abort();
  });
}
