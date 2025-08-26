import React, { useMemo, useState } from 'react'
import SourceCard from './SourceCard.jsx'

export default function References({ matches, makeRefId }) {
  const defaultOpen = useMemo(() => {
    const s = new Set()
    const first = matches.find((m) => m.n === 1) ? 1 : (matches[0]?.n ?? 1)
    s.add(first)
    return s
  }, [matches])

  const [openSet, setOpenSet] = useState(defaultOpen)

  function toggle(n, open) {
    setOpenSet((prev) => {
      const next = new Set(prev)
      if (open) next.add(n)
      else next.delete(n)
      return next
    })
  }

  function expandAll() {
    setOpenSet(new Set(matches.map((m) => m.n)))
  }

  function collapseAll() {
    setOpenSet(new Set())
  }

  return (
    <section className="refsWrap">
      <div className="refsHeader">
        <div className="refsTitle">Sources</div>
        <div className="refsActions">
          <button className="ghost small" onClick={expandAll}>Expand all</button>
          <button className="ghost small" onClick={collapseAll}>Collapse all</button>
        </div>
      </div>

      <ul className="refsList">
        {matches.map((m) => (
          <li key={m.id || m.n} id={makeRefId(m.n)} className="sourceItem">
            <SourceCard
              m={m}
              open={openSet.has(m.n)}
              onToggle={(isOpen) => toggle(m.n, isOpen)}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}
