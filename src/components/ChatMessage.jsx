import React from 'react'

export default function ChatMessage({ role, text, children }) {
  const isUser = role === 'user'
  const avatar = isUser ? '🙂' : '🕊️'
  const label = isUser ? 'You' : 'Assistant'

  return (
    <div className={`message ${isUser ? 'user' : 'bot'}`}>
      <div className="avatar" aria-label={label} title={label}>
        {avatar}
      </div>
      <div className={`bubble ${isUser ? 'user' : 'bot'}`}>
        {isUser ? (
          <pre className="plaintext">{text}</pre>
        ) : (
          children
        )}
      </div>
    </div>
  )
}
