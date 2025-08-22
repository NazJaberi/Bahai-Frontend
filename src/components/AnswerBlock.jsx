import React, { useMemo, useState } from 'react'

// Renders the answer, preserves whitespace, and makes [n] clickable
export default function AnswerBlock({ label, answer, onCiteClick, onCiteHover }) {
  const [copied, setCopied] = useState(false)

  const parts = useMemo(() => tokenizeCitations(answer), [answer])

  async function copyAnswer() {
    await navigator.clipboard.writeText(answer || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  return (
    <section className="answerBlock">
      <div className="answerHeader">{label || 'Answer'}</div>
      <div className="answerText">
        {parts.map((p, i) =>
          p.type === 'cite' ? (
            <button
              key={i}
              type="button"
              className="citeBadge"
              onClick={() => onCiteClick?.(p.n)}
              onMouseEnter={() => onCiteHover?.(p.n, true)}
              onMouseLeave={() => onCiteHover?.(p.n, false)}
              title={`Go to reference [${p.n}]`}
            >
              [{p.n}]
            </button>
          ) : (
            <span key={i}>{p.text}</span>
          )
        )}
      </div>
      <div className="answerActions">
        <button className="ghost small" onClick={copyAnswer} title="Copy answer">
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </section>
  )
}

// Converts "… text [1] and [2] …" into [{text}, {cite:1}, {text}, {cite:2}, …]
function tokenizeCitations(s) {
  const out = []
  const str = String(s || '')
  const re = /\[(\d+)\]/g
  let last = 0
  let m
  while ((m = re.exec(str)) !== null) {
    if (m.index > last) out.push({ type: 'text', text: str.slice(last, m.index) })
    const n = Number(m[1])
    out.push({ type: 'cite', n })
    last = m.index + m[0].length
  }
  if (last < str.length) out.push({ type: 'text', text: str.slice(last) })
  return out
}
