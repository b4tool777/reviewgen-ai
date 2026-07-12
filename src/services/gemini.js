const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY
const API_URL = 'https://openrouter.ai/api/v1/chat/completions'

async function callAI(reviewText, tone, rating) {
  const toneInstructions = {
    Professional: 'Write in a professional, polished, businesslike tone.',
    Friendly: 'Write in a warm, friendly, approachable tone, like a helpful staff member.',
    Formal: 'Write in a formal, respectful, slightly reserved tone.',
  }

  const prompt = `You are a customer service assistant. ${toneInstructions[tone]} Analyze this Google review, considering BOTH the written text AND the star rating together — they don't always agree, and that matters.

Review text: "${reviewText}"
Star rating: ${rating} out of 5 stars

Guidance:
- If the text sounds positive but the rating is only 3 stars (or similarly mismatched, e.g. glowing text with a low rating, or a critical comment with a high rating), acknowledge the kind words but gently and naturally ask what could be improved to earn a higher rating next time. Don't ignore the gap.
- If text and rating clearly agree (e.g. 5 stars + positive text, or 1-2 stars + negative text), respond accordingly without needing to probe further.
- Base the "sentiment" field mainly on the star rating: 4-5 stars = Positive, 3 stars = Neutral, 1-2 stars = Negative — but let the reply's tone reflect the fuller picture, not just the star count in isolation.

Respond in JSON only, no markdown, no code fences, no explanation, no extra text before or after the JSON.

Return exactly this JSON structure and nothing else:
{
  "sentiment": "Positive" | "Neutral" | "Negative",
  "reply": "a reply to the customer, 2-4 sentences, addressing their specific feedback and the rating context"
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

export async function generateReply(reviewText, tone = 'Professional', rating = 5) {
  try {
    return await callAI(reviewText, tone, rating)
  } catch (err) {
    console.warn('First attempt failed, retrying once...', err.message)
    return await callAI(reviewText, tone, rating)
  }
}