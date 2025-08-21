import React from 'react'

export default function ChatMessage({ role, html, text }) {
  const isUser = role === 'user'
  const avatar = isUser ? '🙂' : '🕊️'
  const label = isUser ? 'You' : 'Assistant'

  return (
    <div className={`message ${isUser ? 'user' : 'bot'}`}>
      <div className="avatar" aria-label={label} title={label}>
        {avatar}
      </div>
      <div
        className={`bubble ${isUser ? 'user' : 'bot'}`}
        {...(isUser
          ? { children: <pre className="plaintext">{text}</pre> }
          : { dangerouslySetInnerHTML: { __html: html || '' } })}
      />
    </div>
  )
}
