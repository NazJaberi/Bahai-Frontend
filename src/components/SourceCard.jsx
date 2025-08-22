import React, { useState } from 'react'

export default function SourceCard({ m, open, onToggle }) {
  const [copied, setCopied] = useState(false)
  const meta = m?.meta || {}
  const header = formatHeader(m)

  async function copyCitation() {
    const text = formatCitation(m)
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  return (
    <div className="sourceCard">
      <div className="sourceHeader">
        <div className="sourceTitle">
          <span className="badge">[{m.n}]</span> {header}
          {typeof m.score === 'number' && (
            <span className="score">score {m.score.toFixed(2)}</span>
          )}
        </div>
        {meta.section_title && (
          <div className="sourceSubtitle">{meta.section_title}</div>
        )}
      </div>

      <details
        open={open}
        onToggle={(e) => onToggle?.(e.currentTarget.open)}
        className="sourceBody"
      >
        <summary className="summaryLink">Show passage</summary>
        {meta.text && <pre className="passage">{meta.text}</pre>}
      </details>

      <div className="sourceActions">
        {meta.url && (
          <a
            className="ghost small"
            href={meta.url}
            target="_blank"
            rel="noreferrer"
            title="Open source"
          >
            View source
          </a>
        )}
        <button className="ghost small" onClick={copyCitation}>
          {copied ? 'Copied' : 'Copy citation'}
        </button>
      </div>
    </div>
  )
}

function formatHeader(m) {
  const meta = m?.meta || {}
  const bits = []
  if (meta.author) bits.push(meta.author)
  if (meta.work) bits.push(`— ${meta.work}`)
  const sec = meta.section
  const para = meta.para
  const tail = [
    sec !== undefined && sec !== null ? `§${sec}` : null,
    para !== undefined && para !== null ? `¶${para}` : null
  ].filter(Boolean)
  if (tail.length) bits.push(', ' + tail.join(', '))
  return bits.join(' ')
}

function formatCitation(m) {
  const meta = m?.meta || {}
  const hdr = formatHeader(m)
  const quote = meta.text ? ` “${trimForCitation(meta.text)}”` : ''
  return `${hdr}.${quote}`
}

function trimForCitation(s, max = 200) {
  const str = String(s || '').replace(/\s+/g, ' ').trim()
  if (str.length <= max) return str
  return str.slice(0, max - 1) + '…'
}
