import React, { useEffect, useRef, useState } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

export default function App(){
  const [chat, setChat] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollerRef = useRef(null)

  useEffect(() => { scrollerRef.current?.scrollTo(0, 9_999_999) }, [chat])

  // bootstrap – pošli syntetického usera v češtině
  useEffect(() => {
    if (chat.length > 0) return
    const bootstrap = async () => {
      setLoading(true)
      const firstMessages = [{ role: 'user', content: 'Ahoj' }]
      try{
        const r = await fetch('/.netlify/functions/concierge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: firstMessages })
        })
        const data = await r.json()
        setChat([{ role: 'assistant', content: data.reply }])
      }catch(e){
        setChat([{ role: 'assistant', content: '⚠️ Nelze se připojit k serveru. Zkuste prosím znovu.' }])
      }finally{
        setLoading(false)
      }
    }
    bootstrap()
  }, [])

  async function send(){
    if(!input.trim()) return
    const next = [...chat, { role: 'user', content: input }]
    setChat(next); setInput(''); setLoading(true)
    try{
      const r = await fetch('/.netlify/functions/concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next })
      })
      const data = await r.json()
      setChat([...next, { role: 'assistant', content: data.reply }])
    }catch(e){
      setChat([...next, { role: 'assistant', content: '⚠️ Nelze se připojit k serveru. Zkuste to prosím znovu.' }])
    }finally{
      setLoading(false)
    }
  }

  function renderAssistant(md = ''){
    const rawHtml = marked.parse(md, { breaks: true })
    const cleanHtml = DOMPurify.sanitize(rawHtml)
    return <div className="bubble bot" dangerouslySetInnerHTML={{ __html: cleanHtml }} />
  }

  return (
    <div className="row">
      <div className="scroller" ref={scrollerRef}>
        {chat.map((m,i) => m.role === 'assistant'
          ? <div key={i}>{renderAssistant(m.content)}</div>
          : <div key={i} className="bubble me">{m.content}</div>
        )}
      </div>

      <div className="input">
        <textarea
          placeholder="Napište dotaz…"
          value={input}
          onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); send(); } }}
        />
        <button disabled={loading} onClick={send}>{loading ? '…' : 'Poslat'}</button>
      </div>
    </div>
  )
}
