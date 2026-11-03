import Peer from "peerjs";
import { createDiagnostics } from "./diagnostics.js";
import QRCode from "qrcode";
import "./style.css";
import {
  makeSession,
  sessionUrl,
  parseSession,
  validHello,
  verificationCode,
} from "./session.js";
const $ = (id) => document.getElementById(id);
const show = (id, on = true) => ($(id).hidden = !on);
const say = (id, message) => ($(id).textContent = message);
let peer,
  connection,
  mediaCall,
  localStream,
  timer,
  authTimer,
  pending,
  session,
  joinUrl,
  accepted = false,
  stopping = false,
  connectionTimer,
  reconnectTimer,
  reconnectAttempts = 0;
const isSender = location.hash.startsWith("#join=");
const diagnostics = createDiagnostics();
function trace(event, value = '') {
  diagnostics.record(event, value);
  $('connection-details').textContent = JSON.stringify({version:'0.1.2', role:isSender?'sender':'receiver', screenCapture:typeof navigator.mediaDevices?.getDisplayMedia==='function', events:diagnostics.snapshot()}, null, 2);
}
$('copy-diagnostics').onclick=async()=>{
 try {await navigator.clipboard.writeText($('connection-details').textContent);say('copy-diagnostics','Kopyalandı');}
 catch { $('diagnostics').open=true; }
};
trace('page-ready');
function observeData(c) {
 trace('data-created');
 c.on('open',()=>trace('data-open'));
 c.on('iceStateChanged',state=>trace('ice',state));
 c.on('error',e=>trace('data-error',e.type||'unknown'));
 c.on('close',()=>trace('data-closed'));
}

function error(message) {
  say("global-error", message);
  show("global-error");
  $("diagnostics").open=true;
}
function clearTimers() {
  clearTimeout(timer);
  clearTimeout(authTimer);
  clearTimeout(connectionTimer);
  clearTimeout(reconnectTimer);
  reconnectTimer = null;
}
function stopSession(message = "Oturum sonlandırıldı.") {
  if (stopping) return;
  stopping = true;
  clearTimers();
  const oldPeer = peer,
    oldConnection = connection,
    oldPending = pending,
    oldCall = mediaCall,
    oldStream = localStream;
  peer = null;
  connection = null;
  pending = null;
  mediaCall = null;
  localStream = null;
  accepted = false;
  reconnectAttempts = 0;
  oldStream?.getTracks().forEach((t) => t.stop());
  oldCall?.close();
  oldConnection?.close();
  oldPending?.close();
  oldPeer?.destroy();
  $("video").srcObject = null;
  show("viewer", false);
  show("consent", false);
  show(isSender ? "sender" : "pair");
  say(isSender ? "sender-status" : "status", message);
  if (isSender) {
    const canRetry = session && Date.now() < session.expires;
    $("join").disabled = false;
    say("join", "Tekrar bağlan");
    show("join", Boolean(canRetry));
    show("share", false);
    show("capability", false);
    say("sender-code", "");
  } else {
    $("copy").disabled = true;
    show("qr", false);
    say("qr-loading", "Yeni bağlantı için Yenile’ye dokun.");
    show("qr-loading");
  }
  stopping = false;
}
function setupPeer(id) {
  const p = id ? new Peer(id) : new Peer();
  p.on("open", () => {
    trace("signal-open");
    if (peer !== p) return;
    reconnectAttempts = 0;
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  });
  function recover() {
    trace("signal-reconnecting");
    if (stopping || peer !== p || p.destroyed || reconnectTimer) return;
    if (reconnectAttempts >= 3) {
      if (!connection?.open)
        stopSession(
          "Bağlantı sunucusuna erişilemiyor. Tekrar bağlanmayı dene.",
        );
      return;
    }
    reconnectTimer = setTimeout(
      () => {
        reconnectTimer = null;
        if (peer !== p || p.destroyed) return;
        reconnectAttempts++;
        if (p.disconnected) p.reconnect();
      },
      1500 * 2 ** reconnectAttempts,
    );
  }
  p.on("error", (e) => {
    trace("signal-error",e.type||"unknown");
    if (stopping || peer !== p) return;
    if (["network", "socket-error", "socket-closed"].includes(e.type)) {
      recover();
      return;
    }
    const message =
      e.type === "peer-unavailable"
        ? "Tablet bulunamadı. Tablet sayfasını açık tutup tekrar bağlan."
        : `Bağlantı kurulamadı (${e.type || "unknown"}). Tekrar bağlanmayı dene.`;
    stopSession(message);
    error(message);
  });
  p.on("disconnected", recover);
  return p;
}
function monitorConnection(c) {
  c.on("close", () => {
    if (!stopping && connection === c)
      stopSession("Diğer cihaz bağlantıyı kapattı.");
  });
  c.on("error", () => {
    $("diagnostics").open=true;
    if (!stopping && connection === c)
      stopSession("Cihazlar arasında veri bağlantısı kurulamadı. Bağlantı ayrıntılarındaki hata kodunu paylaşabilirsin.");
  });
}
async function startReceiver() {
  stopSession();
  show("global-error", false);
  show("qr", false);
  show("qr-loading");
  say("qr-loading", "Bağlantı hazırlanıyor…");
  say("status", "Bağlantı hazırlanıyor…");
  $("copy").disabled = true;
  session = makeSession();
  accepted = false;
  peer = setupPeer("i2a-" + session.id);
  connectionTimer = setTimeout(() => {
    stopSession("Bağlantı zaman aşımına uğradı. Yenile’ye dokun.");
  }, 45000);
  peer.once("open", async () => {
    clearTimeout(connectionTimer);
    joinUrl = sessionUrl(session, location.href.split("#")[0]);
    try {
      await QRCode.toCanvas($("qr"), joinUrl, {
        width: 216,
        margin: 2,
        errorCorrectionLevel: "M",
        color: { dark: "#101419", light: "#ffffff" },
      });
      show("qr");
      show("qr-loading", false);
      $("copy").disabled = false;
      say("status", "● iPhone bağlantısı bekleniyor");
      timer = setTimeout(
        () => {
          if (!accepted)
            stopSession("QR kodunun süresi doldu. Yenile’ye dokun.");
        },
        Math.max(0, session.expires - Date.now()),
      );
    } catch {
      error("QR kodu oluşturulamadı. Yenile’ye dokun.");
    }
  });
  peer.on("connection", (c) => {
    observeData(c);
    if (pending || connection || Date.now() >= session.expires) {
      c.on("open", () => c.close());
      return;
    }
    pending = c;
    authTimer = setTimeout(() => {
      if (pending === c) {
        pending = null;
        show("consent", false);
        say(
          "status",
          "Cihaz bağlantısı kurulamadı. iPhone’da Tekrar bağlan’a dokun.",
        );
      }
      c.close();
    }, 45000);
    c.on("open", () => {
      if (pending !== c) return;
      clearTimeout(authTimer);
      authTimer = setTimeout(() => {
        if (pending === c) {
          pending = null;
          c.close();
          say("status", "Doğrulama alınamadı. Tekrar bağlan.");
        }
      }, 10000);
    });
    c.on("data", async (d) => {
      if (d?.type === "hello" && pending === c) {
        if (!validHello(d, session)) {
          c.close();
          pending = null;
          return;
        }
        clearTimeout(authTimer);
        say("verify-code", await verificationCode(session.key));
        show("consent");
        $("consent").scrollIntoView({ behavior: "smooth", block: "center" });
        say("status", "Cihaz bulundu · bağlantıyı aşağıdan kabul et");
      } else if (
        c === connection &&
        accepted &&
        d?.type === "capture-unavailable"
      ) {
        say("status", "Cihaz bağlandı · ekran aktarımı desteklenmiyor");
        say(
          "pair-note",
          "iPhone tarayıcısı ekran yayını açamıyor. Bu sürümde iOS yayın uzantısı ve Bluetooth kontrolü bulunmuyor.",
        );
      } else if (
        c === connection &&
        accepted &&
        d?.type === "sharing-stopped"
      ) {
        stopSession("Gönderici ekran paylaşımını durdurdu.");
      }
    });
    c.on("close", () => {
      if (pending === c) {
        pending = null;
        clearTimeout(authTimer);
        show("consent", false);
        say("status", "● iPhone bağlantısı bekleniyor");
      }
    });
  });
  peer.on("call", (call) => {
    if (
      !accepted ||
      call.peer !== connection?.peer ||
      call.metadata?.key !== session.key
    ) {
      call.close();
      return;
    }
    if (mediaCall) {
      call.close();
      return;
    }
    mediaCall = call;
    call.answer();
    connectionTimer = setTimeout(() => {
      if (!$("video").srcObject)
        stopSession(
          "Görüntü bağlantısı kurulamadı. Cihazları aynı Wi-Fi ağına bağlayıp tekrar dene.",
        );
    }, 45000);
    call.on("stream", (stream) => {
      clearTimeout(connectionTimer);
      $("video").srcObject = stream;
      show("pair", false);
      show("viewer");
      $("video")
        .play()
        .catch(() => error("Görüntüyü başlatmak için ekrana dokun."));
    });
    call.on("close", () => {
      if (!stopping && mediaCall === call)
        stopSession("Ekran yayını sona erdi.");
    });
    call.on("error", () => stopSession("Görüntü bağlantısı kesildi."));
  });
}
$("accept").onclick = () => {
  if (!pending || Date.now() >= session.expires)
    return stopSession("QR kodunun süresi doldu.");
  connection = pending;
  pending = null;
  accepted = true;
  trace("pairing-accepted");
  clearTimeout(timer);
  clearTimeout(authTimer);
  show("consent", false);
  show("qr", false);
  say("qr-loading", "✓ Cihaz eşleştirildi");
  show("qr-loading");
  $("copy").disabled = true;
  connection.send({ type: "accepted" });
  monitorConnection(connection);
  say("status", "● Eşleştirildi · ekran yayını bekleniyor");
};
$("reject").onclick = () => {
  pending?.close();
  pending = null;
  clearTimeout(authTimer);
  show("consent", false);
  say("status", "● iPhone bağlantısı bekleniyor");
};
function startSender() {
  show("pair", false);
  show("sender");
  session = parseSession(location.hash);
  if (!session) {
    say(
      "sender-status",
      "Bu bağlantı geçersiz veya süresi dolmuş. Tablette QR kodunu yenileyip tekrar okut.",
    );
    show("join", false);
    return;
  }
  $("join").onclick = async () => {
    if (Date.now() >= session.expires) {
      say("sender-status", "QR kodunun süresi doldu. Yeni kodu okut.");
      return;
    }
    show("global-error", false);
    show("capability", false);
    $("join").disabled = true;
    say("sender-code", "");
    say(
      "sender-status",
      "Tablete bağlanılıyor… İki cihazın da sayfasını açık tut.",
    );
    peer = setupPeer();
    connectionTimer = setTimeout(
      () =>
        stopSession(
          "Bağlantı zaman aşımına uğradı. İki sayfayı da açık tutup Tekrar bağlan’a dokun.",
        ),
      45000,
    );
    peer.once("open", () => {
      connection = peer.connect("i2a-" + session.id, { reliable: true });
      observeData(connection);
      connection.on("open", async () => {
        clearTimeout(connectionTimer);
        connection.send({ type: "hello", key: session.key });
        say("sender-code", await verificationCode(session.key));
        say(
          "sender-status",
          "Tablette aynı kodun göründüğünü kontrol edip bağlantıyı kabul et.",
        );
      });
      monitorConnection(connection);
      connection.on("data", (d) => {
        if (d?.type !== "accepted" || accepted) return;
        accepted = true;
        show("join", false);
        say("sender-title", "Tablet bağlandı");
        if (typeof navigator.mediaDevices?.getDisplayMedia !== "function") {
          say(
            "sender-status",
            "Eşleştirme tamamlandı. Bu tarayıcı iPhone ekranını paylaşamıyor.",
          );
          say(
            "capability",
            "Ekran aktarımı için iOS yayın uygulaması gerekiyor. Bu prototip henüz iOS yayın uygulaması veya uzaktan kontrol içermiyor. Kamera görüntüsü, iPhone ekranı yerine kullanılmaz.",
          );
          show("capability");
          connection.send({ type: "capture-unavailable" });
        } else {
          say(
            "sender-status",
            "Paylaşmak istediğin ekranı seçmek için aşağıya dokun.",
          );
          show("share");
        }
      });
    });
  };
}
$("share").onclick = async () => {
  if (!accepted || !connection?.open) return;
  $("share").disabled = true;
  try {
    localStream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: { ideal: 30, max: 30 } },
      audio: true,
    });
    mediaCall = peer.call(connection.peer, localStream, {
      metadata: { key: session.key },
    });
    say(
      "sender-status",
      "Ekran yayını başlatıldı. Paylaşımı tarayıcının ekran paylaşım kontrolünden durdurabilirsin.",
    );
    show("share", false);
    localStream.getVideoTracks()[0].onended = () => {
      connection?.send({ type: "sharing-stopped" });
      stopSession("Ekran paylaşımı durduruldu.");
    };
    mediaCall.on("error", () => stopSession("Ekran aktarımı kurulamadı."));
    mediaCall.on("close", () => {
      if (!stopping) stopSession("Tablet ekran aktarımını kapattı.");
    });
  } catch (e) {
    localStream?.getTracks().forEach((t) => t.stop());
    localStream = null;
    say(
      "sender-status",
      e.name === "NotAllowedError"
        ? "Ekran paylaşımı iptal edildi. Yeniden deneyebilirsin."
        : "Bu cihazda ekran paylaşımı başlatılamadı.",
    );
    $("share").disabled = false;
  }
};
$("copy").onclick = async () => {
  try {
    await navigator.clipboard.writeText(joinUrl);
    say("copy", "Kopyalandı ✓");
    setTimeout(() => say("copy", "Bağlantıyı kopyala"), 2000);
  } catch {
    error("Bağlantı kopyalanamadı. QR kodunu telefon kameranla okut.");
  }
};
$("renew").onclick = () => {
  say("pair-note", "Her oturum için yeni bir QR kodu oluşturulur.");
  startReceiver();
};
$("stop").onclick = () => stopSession();
$("fullscreen").onclick = async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.querySelector(".video-stage").requestFullscreen();
  } catch {
    error("Bu tarayıcı tam ekran görünümünü desteklemiyor.");
  }
};
$("audio").onclick = () => {
  $("video").muted = !$("video").muted;
  say("audio", $("video").muted ? "Sesi aç" : "Sesi kapat");
};
let installPrompt;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  installPrompt = e;
  show("install");
});
$("install").onclick = async () => {
  if (!installPrompt) return;
  await installPrompt.prompt();
  installPrompt = null;
  show("install", false);
};
window.addEventListener("pagehide", () => stopSession());
window.addEventListener("pageshow", (e) => {
  if (e.persisted) {
    if (isSender) startSender();
    else startReceiver();
  }
});
if (isSender) startSender();
else startReceiver();
