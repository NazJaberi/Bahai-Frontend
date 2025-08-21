// Robust API client for your Cloudflare Worker
// - In DEV: always call "/api/ask" (proxied by Vite to your Worker).
// - In PROD: call VITE_API_BASE + "/ask" (no double /ask, trailing slashes removed).

const DEV = import.meta.env.DEV

function normalizeBase(raw) {
  const s = (raw || '').trim()
  if (!s) return ''
  // remove trailing slash(es)
  const noSlash = s.replace(/\/+$/, '')
  // if someone accidentally put "/ask" in the env, strip it
  return noSlash.replace(/\/ask$/i, '')
}

const prodBase = normalizeBase(import.meta.env.VITE_API_BASE)

export async function ask(question, { signal } = {}) {
  const base = DEV ? '/api' : prodBase
  const url = `${base}/ask`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // mode: 'cors' is default in browsers; explicit is fine
    mode: 'cors',
    body: JSON.stringify({ q: question }),
    signal
  })

  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try {
      const data = await res.json()
      msg = data.error || data.message || msg
    } catch {
      const text = await res.text()
      if (text) msg = text
    }
    throw new Error(msg)
  }

  const data = await res.json()
  const answer =
    data?.answer ??
    data?.text ??
    data?.result ??
    (typeof data === 'string' ? data : JSON.stringify(data, null, 2))

  const citationsRaw =
    Array.isArray(data?.citations) ? data.citations :
    Array.isArray(data?.sources) ? data.sources :
    Array.isArray(data?.refs) ? data.refs : []

  const citations = citationsRaw.map((c) => normalizeCitation(c))
  return { answer, citations }
}

function normalizeCitation(c) {
  try {
    if (typeof c === 'string') {
      try {
        const u = new URL(c)
        return { label: u.hostname.replace(/^www\./, ''), url: u.toString() }
      } catch {
        return { label: c }
      }
    }
    if (c && typeof c === 'object') {
      const url = c.url || c.href || null
      const label =
        c.title || c.label || (url ? new URL(url).hostname.replace(/^www\./, '') : 'Source')
      return { label, url: url || undefined }
    }
  } catch {}
  return { label: 'Source' }
}
