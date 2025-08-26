import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ask } from './api'
import ChatMessage from './components/ChatMessage.jsx'
import TypingDots from './components/TypingDots.jsx'
import AnswerBlock from './components/AnswerBlock.jsx'
import References from './components/References.jsx'

const STORAGE_KEY = 'bahai_chat_history_v3'

export default function App() {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      const parsed = saved ? JSON.parse(saved) : null
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // API options
  const [explain, setExplain] = useState(false)
  const [simplify, setSimplify] = useState(false)
  const [topK, setTopK] = useState(6)
  const [scoreMin, setScoreMin] = useState(0.4)
  const [ctx, setCtx] = useState('')

  // Dev mode
  const [devMode, setDevMode] = useState(false)

  const bottomRef = useRef(null)
  const textareaRef = useRef(null)
  const abortRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, loading])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
  }, [messages])

  useEffect(() => autoResize(), [input])
  function autoResize() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = '0px'
    const h = Math.min(180, el.scrollHeight)
    el.style.height = h + 'px'
  }

  function newId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  }

  function clearChat() {
    setMessages([])
    setError('')
    setInput('')
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function clampTopK(v) {
    const n = Number(v)
    if (Number.isNaN(n)) return 6
    return Math.min(12, Math.max(1, Math.round(n)))
  }

  function clampScore(v) {
    const n = Number(v)
    if (Number.isNaN(n)) return 0.4
    return Math.min(1, Math.max(0, Math.round(n * 100) / 100))
  }

  async function handleSend() {
    const text = (input || '').trim()
    if (!text || loading) return

    setError('')
    setInput('')

    const userMsg = {
      id: newId(),
      role: 'user',
      text,
      createdAt: Date.now()
    }
    setMessages((prev) => [...prev, userMsg])

    setLoading(true)
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const payload = {
        q: text,
        explain,
        simplify,
        topK: clampTopK(topK),
        scoreMin: clampScore(scoreMin),
        ...(ctx.trim() ? { ctx: ctx.trim() } : {})
      }

      const data = await ask(payload, { signal: controller.signal })

      const botMsg = {
        id: newId(),
        role: 'assistant',
        data, // { answer, matches, expansions, explain, simplify, debug? }
        createdAt: Date.now()
      }
      setMessages((prev) => [...prev, botMsg])
    } catch (err) {
      console.error(err)
      setError(String(err?.message || err || 'Something went wrong'))
      const botMsg = {
        id: newId(),
        role: 'assistant',
        data: {
          answer: `Sorry—there was an error.\n\n> ${String(err?.message || err)}`,
          matches: [],
          expansions: [],
          explain: false,
          simplify: false
        },
        createdAt: Date.now()
      }
      setMessages((prev) => [...prev, botMsg])
    } finally {
      setLoading(false)
      abortRef.current = null
    }
  }

  const headerSubtitle = useMemo(
    () =>
      messages.length === 0
        ? 'Ask about Bahá’í writings—answers include [n] citations with sources below.'
        : 'Shift+Enter: new line • Enter: send • Ctrl/Cmd+K: new chat',
    [messages.length]
  )

  // Ctrl/Cmd+K clears chat
  useEffect(() => {
    const onGlobal = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        clearChat()
      }
    }
    window.addEventListener('keydown', onGlobal)
    return () => window.removeEventListener('keydown', onGlobal)
  }, [])

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo" aria-hidden>🕊️</span>
          <div className="titles">
            <h1>Bahá’í Writings Q&amp;A</h1>
            <p className="subtitle">{headerSubtitle}</p>
          </div>
        </div>
        <div className="controls">
          <button className="ghost" onClick={() => setDevMode((v) => !v)} title="Toggle developer mode">
            {devMode ? 'Developer: On' : 'Developer: Off'}
          </button>
          <button className="ghost" onClick={clearChat} title="Clear chat (Ctrl/Cmd+K)">
            New chat
          </button>
          {loading ? (
            <button className="ghost" onClick={() => abortRef.current?.abort()} title="Abort request">
              Stop
            </button>
          ) : null}
        </div>
      </header>

      <main className="chat">
        {messages.length === 0 && (
          <div className="empty">
            <h2>Welcome</h2>
            <p>Try asking “What is the purpose of prayer?”</p>
          </div>
        )}

        {messages.map((m) => {
          if (m.role === 'user') {
            return (
              <div className="row" key={m.id}>
                <ChatMessage role="user" text={m.text} />
              </div>
            )
          }

          const { answer, matches, expansions, explain, simplify, debug } = m.data || {
            answer: '',
            matches: [],
            expansions: [],
            explain: false,
            simplify: false,
            debug: null
          }
          const makeRefId = (n) => `ref-${m.id}-${n}`

          // Label logic
          const label = explain && simplify
            ? 'Explanation (simplified)'
            : explain
              ? 'Explanation'
              : simplify
                ? 'Simplified answer'
                : 'Concise answer'

          return (
            <div className="row" key={m.id}>
              <ChatMessage role="assistant">
                <AnswerBlock
                  label={label}
                  answer={answer}
                  onCiteClick={(n) => {
                    const el = document.getElementById(makeRefId(n))
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    el?.classList.add('flash')
                    setTimeout(() => el?.classList.remove('flash'), 900)
                  }}
                  onCiteHover={(n, hover) => {
                    const el = document.getElementById(makeRefId(n))
                    if (el) el.classList.toggle('highlight', hover)
                  }}
                />

                {expansions?.length > 0 && (
                  <div className="expansions">
                    <span className="chip">Recognized terms:</span>
                    <span className="expList">{expansions.join(', ')}</span>
                  </div>
                )}

                {matches?.length > 0 ? (
                  <References matches={matches} makeRefId={makeRefId} />
                ) : (
                  <div className="noRefs">
                    <em>No passages retrieved.</em> Try mentioning a book, tablet, theme, or figure.
                  </div>
                )}

                {devMode && debug && (
                  <details className="debugBox" open>
                    <summary>Debug</summary>
                    <pre className="debugPre">{JSON.stringify(debug, null, 2)}</pre>
                  </details>
                )}
              </ChatMessage>
            </div>
          )
        })}

        {loading && (
          <div className="row">
            <div className="message bot">
              <div className="avatar" aria-label="Assistant" title="Assistant">🕊️</div>
              <div className="bubble bot">
                <TypingDots />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </main>

      <footer className="composer">
        <div className="inputWrap">
          <textarea
            ref={textareaRef}
            rows={1}
            maxLength={8000}
            placeholder="Type your question…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <button className="send" onClick={handleSend} disabled={loading || !input.trim()}>
            Send
          </button>
        </div>

        <details className="options">
          <summary>Options</summary>
          <div className="optGrid">
            <label className="optRow">
              <input
                type="checkbox"
                checked={explain}
                onChange={(e) => setExplain(e.target.checked)}
              />
              <span>Explain mode</span>
            </label>

            <label className="optRow">
              <input
                type="checkbox"
                checked={simplify}
                onChange={(e) => setSimplify(e.target.checked)}
              />
              <span>Simplify language</span>
            </label>

            <label className="optRow">
              <span>Top K</span>
              <input
                type="number"
                min="1"
                max="12"
                value={topK}
                onChange={(e) => setTopK(clampTopK(e.target.value))}
              />
            </label>

            <label className="optRow">
              <span>Min score</span>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={scoreMin}
                onChange={(e) => setScoreMin(clampScore(e.target.value))}
              />
            </label>

            <label className="optRow optCtx">
              <span>Extra context</span>
              <textarea
                rows={2}
                placeholder="Optional: notes, keywords, or context"
                value={ctx}
                onChange={(e) => setCtx(e.target.value)}
              />
            </label>
          </div>
        </details>

        {error && <div className="error" role="alert">Error: {error}</div>}
        <div className="fineprint">
          Answers are Markdown with bracketed citations like [1]; see Sources below the answer.
        </div>
      </footer>
    </div>
  )
}
