import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

dotenv.config({ path: path.resolve(dirname, '../../', '.env') })

export async function translateText(text: string, targetLang: string) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    body: JSON.stringify({
      max_tokens: 150,
      messages: [
        {
          content: `Only respond with the translation of the text you receive. The original language is English and the translation language is ${targetLang}. Use formal and professional language. Only respond with the translation - do not say anything else. If you cannot translate the text, respond with "[SKIPPED]"`,
          role: 'system',
        },
        {
          content: text,
          role: 'user',
        },
      ],
      model: 'gpt-4',
    }),
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_KEY}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })
  try {
    const data = await response.json()
    if (data?.choices?.[0]) {
      console.log('  Old text:', text, 'New text:', data.choices[0].message.content.trim())
      return data.choices[0].message.content.trim()
    } else {
      console.log(`Could not translate: ${text} in lang: ${targetLang}`)
    }
  } catch (e) {
    console.error('Error translating:', text, 'to', targetLang, 'response', response, '. Error:', e)
    throw e
  }
}
