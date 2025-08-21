import React from 'react'

export default function CitationChips({ items }) {
  return (
    <div className="citations">
      {items.map((c, i) => {
        const key = `${c.label}-${i}`
        return c.url ? (
          <a
            key={key}
            href={c.url}
            target="_blank"
            rel="noreferrer"
            className="chip"
            title={c.url}
          >
            {c.label}
          </a>
        ) : (
          <span key={key} className="chip" title={c.label}>{c.label}</span>
        )
      })}
    </div>
  )
}
