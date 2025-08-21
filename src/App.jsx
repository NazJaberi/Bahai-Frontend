import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ask } from './api'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import ChatMessage from './components/ChatMessage.jsx'
import TypingDots from './components/TypingDots.jsx'
import CitationChips from './components/CitationChips.jsx'

// Configure marked for nicer output (headings, links, code)
marked.setOptions({
  breaks: true,
  gfm: true
})

const STORAGE_KEY = 'bahai_chat_history_v1'

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
  const bottomRef = useRef(null)
  const abortRef = useRef(null)
  const textareaRef = useRef(null)

  // Autoscroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, loading])

  // Persist conversation
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    autoResize()
  }, [input])

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

  function renderMarkdownToHTML(md) {
    const raw = marked.parse(md || '')
    return DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } })
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
      const { answer, citations } = await ask(text, { signal: controller.signal })
      const html = renderMarkdownToHTML(answer)

      const botMsg = {
        id: newId(),
        role: 'assistant',
        html, // already sanitized HTML
        citations,
        createdAt: Date.now()
      }
      setMessages((prev) => [...prev, botMsg])
    } catch (err) {
      console.error(err)
      setError(String(err?.message || err || 'Something went wrong'))
      const botMsg = {
        id: newId(),
        role: 'assistant',
        html: renderMarkdownToHTML(
          `Sorry—there was an error.\n\n> ${String(err?.message || err)}`
        ),
        citations: [],
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
        ? 'Ask about Bahá’í writings—your AI will search the vector index and answer with citations.'
        : 'Press Shift+Enter for a new line • Enter to send • Ctrl/Cmd+K to clear',
    [messages.length]
  )

  // Keyboard shortcut: Ctrl/Cmd+K clears chat
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
          <button className="ghost" onClick={clearChat} title="Clear chat (Ctrl/Cmd+K)">
            New chat
          </button>
        </div>
      </header>

      <main className="chat">
        {messages.length === 0 && (
          <div className="empty">
            <h2>Welcome</h2>
            <p>Try asking “What is the purpose of prayer?”</p>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className="row">
            <ChatMessage role={m.role} html={m.html} text={m.text} />
            {m.role === 'assistant' && m.citations && m.citations.length > 0 && (
              <CitationChips items={m.citations} />
            )}
          </div>
        ))}

        {loading && (
          <div className="row">
            <div className="bubble bot">
              <TypingDots />
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
        {error && <div className="error" role="alert">Error: {error}</div>}
        <div className="fineprint">
          Answers may cite passages from your index; verify important details.
        </div>
      </footer>
    </div>
  )
}
