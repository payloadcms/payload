import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

dotenv.config({ path: path.resolve(dirname, '../../', '.env') })

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const MAX_RETRIES = 4
const INITIAL_EXPONENTIAL_BACKOFF_MS = 500

export function translateText(text: string, targetLang: string, retryCount = 0) {
  return new Promise<string | undefined>(async (resolve, reject) => {
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
        resolve(data.choices[0].message.content.trim())
      } else if (data?.error?.code === 'rate_limit_exceeded') {
        const rateLimitExceededMsg = `OpenAI API rate limit exceeded translating: "${text}" in lang: ${targetLang}. `

        // Stop retrying after MAX_RETRIES
        if (retryCount >= MAX_RETRIES) {
          console.log(rateLimitExceededMsg, `Max retries reached (MAX_RETRIES=${MAX_RETRIES}).`)
          resolve(undefined)
          return
        }

        // Retry after waiting for an exponential backoff
        const retryAfterMS = 2 ** retryCount * INITIAL_EXPONENTIAL_BACKOFF_MS

        console.log(rateLimitExceededMsg, `Retrying after ${retryAfterMS}ms`)

        await delay(retryAfterMS)
        resolve(translateText(text, targetLang, retryCount + 1))
      } else {
        console.log(`Could not translate: ${text} in lang: ${targetLang}`)
        resolve(undefined)
      }
    } catch (e) {
      console.error(
        `Error translating:' ${text} to ${targetLang}. Response:`,
        response,
        '. Error:',
        e,
      )
      reject(e)
    }
  })
}
