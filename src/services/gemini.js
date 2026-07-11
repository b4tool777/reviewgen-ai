const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY
const API_URL = 'https://openrouter.ai/api/v1/chat/completions'

async function callAI(reviewText, tone) {
  const toneInstructions = {
    Professional: 'Write in a professional, polished, businesslike tone.',
    Friendly: 'Write in a warm, friendly, approachable tone, like a helpful staff member.',
    Formal: 'Write in a formal, respectful, slightly reserved tone.',
  }

  const prompt = `You are a customer service assistant. ${toneInstructions[tone]} Analyze this Google review and respond in JSON only, no markdown, no code fences, no explanation, no extra text before or after the JSON.

Review: "${reviewText}"

Return exactly this JSON structure and nothing else:
{
  "sentiment": "Positive" | "Neutral" | "Negative",
  "reply": "a reply to the customer, 2-4 sentences, addressing their specific feedback"
}`

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'openrouter/free',
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data?.error?.message || 'Failed to generate reply')
  }

  const message = data.choices?.[0]?.message
  let rawText = message?.content || message?.reasoning

  if (!rawText) {
    throw new Error('No response from AI')
  }

  const jsonMatch = rawText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('AI response did not contain valid JSON')
  }

  const parsed = JSON.parse(jsonMatch[0])

  if (!parsed.sentiment || !parsed.reply) {
    throw new Error('AI response was missing expected fields')
  }

  return parsed
}

export async function generateReply(reviewText, tone = 'Professional') {
  try {
    return await callAI(reviewText, tone)
  } catch (err) {
    console.warn('First attempt failed, retrying once...', err.message)
    // Retry once — the free model rotation occasionally returns malformed output
    return await callAI(reviewText, tone)
  }
}