const DEV = import.meta.env.DEV

function normalizeBase(raw) {
  const s = (raw || '').trim()
  if (!s) return ''
  return s.replace(/\/+$/, '').replace(/\/ask$/i, '')
}

const prodBase = normalizeBase(import.meta.env.VITE_API_BASE)

/**
 * payload = { q: string, explain?: boolean, simplify?: boolean, topK?: number, scoreMin?: number, ctx?: string|string[] }
 */
export async function ask(payload, { signal } = {}) {
  if (!payload || typeof payload.q !== 'string' || !payload.q.trim()) {
    throw new Error('Question "q" is required')
  }

  const base = DEV ? '/api' : prodBase
  const url = `${base}/ask`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    mode: 'cors',
    body: JSON.stringify(payload),
    signal
  })

  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try {
      const err = await res.json()
      msg = err?.error || err?.message || msg
    } catch {
      const text = await res.text()
      if (text) msg = text
    }
    throw new Error(msg)
  }

  const data = await res.json()

  const answer = typeof data?.answer === 'string' ? data.answer : ''
  const matches = Array.isArray(data?.matches) ? data.matches : []
  const expansions = Array.isArray(data?.expansions) ? data.expansions : []
  const explain = Boolean(data?.explain)
  const simplify = Boolean(data?.simplify)
  const debug = data?.debug ?? null

  matches.forEach((m, i) => {
    if (typeof m?.n !== 'number') m.n = i + 1
  })

  return { answer, matches, expansions, explain, simplify, debug }
}
