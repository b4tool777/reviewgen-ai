import { useState, useEffect } from 'react'
import { generateReply } from './services/gemini'
import { supabase } from './services/supabase'

function App() {
  const [reviewText, setReviewText] = useState('')
  const [sentiment, setSentiment] = useState(null)
  const [reply, setReply] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [tone, setTone] = useState('Professional')
  const [rating, setRating] = useState(5)

  const sentimentStyles = {
    Positive: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    Neutral: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    Negative: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  }

  const fetchHistory = async () => {
    setHistoryLoading(true)
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (!error) setHistory(data)
    setHistoryLoading(false)
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  const handleGenerate = async () => {
    if (!reviewText.trim()) return
    setLoading(true)
    setError('')
    setReply('')
    setSentiment(null)

    try {
      const result = await generateReply(reviewText, tone, rating)
      setSentiment(result.sentiment)
      setReply(result.reply)

      // Save to Supabase
      const { error: insertError } = await supabase.from('reviews').insert({
        review_text: reviewText,
        sentiment: result.sentiment,
        reply: result.reply,
      })

      if (insertError) {
        console.error('Supabase insert error:', insertError)
      }

      fetchHistory()
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">RG</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-none">ReviewGen AI</h1>
            <p className="text-xs text-slate-500 mt-0.5">AI-powered review replies</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-1">Paste a review</h2>
            <p className="text-sm text-slate-500 mb-4">
              Drop in a customer's Google review and we'll draft a reply.
            </p>

            <div className="flex gap-2 mb-4">
              {['Professional', 'Friendly', 'Formal'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                    tone === t
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  
                  {t}
                </button>
              ))}
            </div>
            <div className="mb-4">
              <p className="text-xs font-medium text-slate-500 mb-2">Star rating</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="text-2xl leading-none transition-transform hover:scale-110"
                    aria-label={`${star} star`}
                  >
                    {star <= rating ? '★' : '☆'}
                  </button>
                ))}
                <span className="ml-2 text-sm text-slate-500 self-center">{rating}/5</span>
              </div>
            </div>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="e.g. The service was quick but the staff seemed a bit distracted..."
              rows={8}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
            />
            <button
              onClick={handleGenerate}
              disabled={!reviewText.trim() || loading}
              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
            >
              {loading ? 'Generating...' : 'Generate Reply'}
            </button>
            {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-900">Generated reply</h2>
              {sentiment && (
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ring-1 ring-inset ${sentimentStyles[sentiment]}`}
                >
                  {sentiment}
                </span>
              )}
            </div>

            {reply ? (
              <>
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 text-sm text-slate-700 leading-relaxed min-h-[160px]">
                  {reply}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="border border-slate-300 hover:bg-slate-50 disabled:opacity-50 text-slate-700 text-sm font-semibold py-2.5 rounded-lg transition-colors"
                  >
                    {loading ? '...' : 'Regenerate'}
                  </button>
                  <button
                    onClick={() => handleCopy(reply)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
                  >
                    {copied ? 'Copied ✓' : 'Copy Reply'}
                  </button>
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center min-h-[160px] flex items-center justify-center">
                <p className="text-sm text-slate-400">
                  {loading ? 'Thinking...' : 'Your generated reply will appear here.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* History section */}
        <div className="mt-10">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Past replies</h2>

          {historyLoading ? (
            <p className="text-sm text-slate-400">Loading history...</p>
          ) : history.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center">
              <p className="text-sm text-slate-400">No saved replies yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm p-5"
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <p className="text-sm text-slate-500 italic flex-1">
                      "{item.review_text}"
                    </p>
                    <span
                      className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ring-1 ring-inset ${sentimentStyles[item.sentiment]}`}
                    >
                      {item.sentiment}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed mb-3">{item.reply}</p>
                  <button
                    onClick={() => handleCopy(item.reply)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Copy
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App