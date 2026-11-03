// Only bounded state labels are retained. Never retain tokens, SDP, IPs or URLs.
export function createDiagnostics({ now = () => Date.now(), limit = 50 } = {}) {
  const started = now();
  const events = [];
  return {
    record(event, value = '') {
      const label = input => String(input).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48);
      events.push({ afterMs: now() - started, event: label(event), value: label(value) });
      if (events.length > limit) events.shift();
    },
    snapshot() { return events.map(e => ({ ...e })); },
  };
}
