/* eslint-disable no-await-in-loop */
/* eslint-disable no-continue */
/* eslint-disable no-restricted-syntax */
import * as fs from 'fs';
import * as path from 'path';

const TRANSLATIONS_DIR = './src/translations';
const SOURCE_LANG_FILE = 'en.json';
const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions'; // Adjust if needed
const OPENAI_API_KEY = 'sk-YOURKEYHERE'; // Remember to replace with your actual key


async function main() {
  const sourceLangContent = JSON.parse(fs.readFileSync(path.join(TRANSLATIONS_DIR, SOURCE_LANG_FILE), 'utf8'));

  const files = fs.readdirSync(TRANSLATIONS_DIR);

  for (const file of files) {
    if (file === SOURCE_LANG_FILE) {
      continue;
    }
    // check if file ends with .json
    if (!file.endsWith('.json')) {
      continue;
    }

    // skip the translation-schema.json file
    if (file === 'translation-schema.json') {
      continue;
    }
    console.log('Processing file:', file);

    const targetLangContent = JSON.parse(fs.readFileSync(path.join(TRANSLATIONS_DIR, file), 'utf8'));
    const missingKeys = findMissingKeys(sourceLangContent, targetLangContent);

    let hasChanged = false;

    for (const missingKey of missingKeys) {
      const keys = missingKey.split('.');
      const sourceText = keys.reduce((acc, key) => acc[key], sourceLangContent);
      const targetLang = file.split('.')[0];

      const translatedText = await translateText(sourceText, targetLang);
      let targetObj = targetLangContent;

      for (let i = 0; i < keys.length - 1; i += 1) {
        if (!targetObj[keys[i]]) {
          targetObj[keys[i]] = {};
        }
        targetObj = targetObj[keys[i]];
      }

      targetObj[keys[keys.length - 1]] = translatedText;
      hasChanged = true;
    }


    if (hasChanged) {
      const sortedContent = sortKeys(targetLangContent);
      fs.writeFileSync(path.join(TRANSLATIONS_DIR, file), JSON.stringify(sortedContent, null, 2));
    }
  }
}

main().then(() => {
  console.log('Translation update completed.');
}).catch((error) => {
  console.error('Error occurred:', error);
});

async function translateText(text: string, targetLang: string): Promise<string> {
  const response = await fetch(OPENAI_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      max_tokens: 150,
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Only respond with the translation of the text you receive. The original language is English and the translation language is ${targetLang}. Only respond with the translation - do not say anything else. If you cannot translate the text, respond with "[SKIPPED]"`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
    }),
  });

  const data = await response.json();
  console.log('  Old text:', text, 'New text:', data.choices[0].message.content.trim());
  return data.choices[0].message.content.trim();
}

function findMissingKeys(baseObj: any, targetObj: any, prefix = ''): string[] {
  let missingKeys = [];

  for (const key in baseObj) {
    if (typeof baseObj[key] === 'object') {
      missingKeys = missingKeys.concat(findMissingKeys(baseObj[key], targetObj[key] || {}, `${prefix}${key}.`));
    } else if (!(key in targetObj)) {
      missingKeys.push(`${prefix}${key}`);
    }
  }

  return missingKeys;
}

function sortKeys(obj: any): any {
  if (typeof obj !== 'object' || obj === null) return obj;

  if (Array.isArray(obj)) {
    return obj.map(sortKeys);
  }

  const sortedKeys = Object.keys(obj).sort();
  const sortedObj: { [key: string]: any } = {};

  for (const key of sortedKeys) {
    sortedObj[key] = sortKeys(obj[key]);
  }

  return sortedObj;
}
