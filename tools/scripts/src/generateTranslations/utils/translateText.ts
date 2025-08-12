import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

dotenv.config({ path: path.resolve(dirname, '../../../../', '.env') })
dotenv.config({ path: path.resolve(dirname, '../../../../../', '.env') })

type TranslationMessage = {
  role: 'system' | 'user'
  content: string
}

export async function translateText(text: string, targetLang: string) {
  const systemMessage: TranslationMessage = {
    role: 'system',
    content: `Only respond with the translation of the text you receive. The original language is English and the translation language is ${targetLang}. Use formal and professional language. Only respond with the translation - do not say anything else.

    Respect the meaning of the original text within the context of Payload. Here is a list of common Payload terms that carry very specific meanings:
    - Collection: A collection is a group of documents that share a common structure and purpose. Collections are used to organize and manage content in Payload.
    - Field: A field is a specific piece of data within a document in a collection. Fields define the structure and type of data that can be stored in a document.
    - Document: A document is an individual record within a collection. It contains data structured according to the fields defined in the collection.
    - Global: A global is a special type of collection that can only have 1 item and there cannot be multiple globals of the same type.
    - Locale: A locale is a specific language or regional setting that can be used to display content in different languages or formats.
    - Tenant: A tenant is a sub group in Payload, allowing a single instance of Payload to isolate users, data and content based on specific permissions.
    - SEO: SEO stands for Search Engine Optimization, which is the practice of optimizing content to improve its visibility and ranking in search engine results.
    - Payload: Payload is the name of the headless CMS platform that this text is related to.
    - Import and export: are terms used to describe the process of transferring data into or out of Payload, typically in a structured format like JSON or CSV.

    If a term is capitalized treat it as a proper noun and do not translate it. If a term is not capitalized, translate it normally. For example, do not translate the word "Payload" or "Field" but you can translate "payload" or "field".

    Examples of translations:
    <examples>
      <nl>
        - Locale: Taal - never locatie
        - Collection: Collectie
      <nl>

      <es>
        - Locale: Idioma - never region or ubicación
        - Collection: Colección
      <es>
    <examples>

    Apply these translations consistently so that the meaning is preserved across different languages. If you are unsure about a translation, use the examples as a guide. If there is not equivalant term in the target language, use the closes term to it. Use the same term consistently throughout the translation.

    Use formal and professional language, avoiding colloquialisms or informal expressions. The translation should be clear, concise, and suitable for a professional context.

    If you cannot translate the text, respond with "[SKIPPED]". Do not translate text inside double curly braces, i.e. "{{do_not_translate}}".
    `,
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    body: JSON.stringify({
      max_tokens: 150,
      messages: [
        systemMessage,
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

    if (response.status > 200) {
      console.log(data.error)
    } else {
      if (data?.choices?.[0]) {
        console.log('  Old text:', text, 'New text:', data.choices[0].message.content.trim())
        return data.choices[0].message.content.trim()
      } else {
        console.log(`Could not translate: ${text} in lang: ${targetLang}`, data.error)
      }
    }
  } catch (e) {
    console.error('Error translating:', text, 'to', targetLang, 'response', response, '. Error:', e)
    throw e
  }
}
