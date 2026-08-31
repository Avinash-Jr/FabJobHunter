export function makeHttpCtx() {
  return {
    async json(url, ms = 9000) {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), ms);
      try {
        const r = await fetch(url, { signal: ctrl.signal, headers: { "user-agent": "FabJobHunter/0.1 (+local)" } });
        if (!r.ok) return null;
        return await r.json();
      } catch { return null; } finally { clearTimeout(t); }
    },
  };
}
