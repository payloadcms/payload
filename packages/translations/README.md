# Payload Translations

The home of Payloads API and Admin Panel translations.

## How to contribute

#### Updating a translation

1. Update the translation value
2. Run one of the following:
   ```sh
   yarn build
   // or
   npm build
   // or
   pnpm build
   ```

#### Adding a new translation

1. Add the new translation key/value pair for **all** languages located in the `<payload-repo-root>/packages/translations/src/languages` folder
2. Run one of the following:
   ```sh
   yarn build
   // or
   npm build
   // or
   pnpm build
   ```

#### Adding a new language

1. Create a new TS file in the `<payload-repo-root>/packages/translations/src/languages` folder, use the language code as the file name (e.g. `<payload-repo-root>/packages/translations/src/languages/en.ts` for English)
2. Copy all translations from an existing language file and update all of the translations to match your new language. Make sure the translation object containing all the translations is type `DefaultTranslationsObject`.
3. Run one of the following:
   ```sh
   yarn build
   // or
   npm build
   // or
   pnpm build
   ```
4. Import and export your new language file from within `<payload-repo-root>/packages/translations/src/exports/all.ts`
5. Re-export the file from within `<payload-repo-root>/packages/payload/src/exports/i18n/[your-new-language].ts`

Here is a full list of language keys. Note that these are not all implemented, but if you would like to contribute and add a new language, you can use this list as a reference:

| Language Code  | Language Name                              |
| -------------- | ------------------------------------------ |
| af             | Afrikaans                                  |
| am             | Amharic                                    |
| ar-sa          | Arabic (Saudi Arabia)                      |
| as             | Assamese                                   |
| az-Latn        | Azerbaijani (Latin)                        |
| be             | Belarusian                                 |
| bg             | Bulgarian                                  |
| bn-BD          | Bangla (Bangladesh)                        |
| bn-IN          | Bangla (India)                             |
| bs             | Bosnian (Latin)                            |
| ca             | Catalan Spanish                            |
| ca-ES-valencia | Valencian                                  |
| cs             | Czech                                      |
| cy             | Welsh                                      |
| da             | Danish                                     |
| de             | German (Germany)                           |
| el             | Greek                                      |
| en-GB          | English (United Kingdom)                   |
| en-US          | English (United States)                    |
| es             | Spanish (Spain)                            |
| es-ES          | Spanish (Spain)                            |
| es-US          | Spanish (United States)                    |
| es-MX          | Spanish (Mexico)                           |
| et             | Estonian                                   |
| eu             | Basque                                     |
| fa             | Persian                                    |
| fi             | Finnish                                    |
| fil-Latn       | Filipino                                   |
| fr             | French (France)                            |
| fr-FR          | French (France)                            |
| fr-CA          | French (Canada)                            |
| ga             | Irish                                      |
| gd-Latn        | Scottish Gaelic                            |
| gl             | Galician                                   |
| gu             | Gujarati                                   |
| ha-Latn        | Hausa (Latin)                              |
| he             | Hebrew                                     |
| hi             | Hindi                                      |
| hr             | Croatian                                   |
| hu             | Hungarian                                  |
| hy             | Armenian                                   |
| id             | Indonesian                                 |
| ig-Latn        | Igbo                                       |
| is             | Icelandic                                  |
| it             | Italian (Italy)                            |
| it-it          | Italian (Italy)                            |
| ja             | Japanese                                   |
| ka             | Georgian                                   |
| kk             | Kazakh                                     |
| km             | Khmer                                      |
| kn             | Kannada                                    |
| ko             | Korean                                     |
| kok            | Konkani                                    |
| ku-Arab        | Central Kurdish                            |
| ky-Cyrl        | Kyrgyz                                     |
| lb             | Luxembourgish                              |
| lt             | Lithuanian                                 |
| lv             | Latvian                                    |
| mi-Latn        | Maori                                      |
| mk             | Macedonian                                 |
| ml             | Malayalam                                  |
| mn-Cyrl        | Mongolian (Cyrillic)                       |
| mr             | Marathi                                    |
| ms             | Malay (Malaysia)                           |
| mt             | Maltese                                    |
| nb             | Norwegian (Bokmål)                         |
| ne             | Nepali (Nepal)                             |
| nl             | Dutch (Netherlands)                        |
| nl-BE          | Dutch (Netherlands)                        |
| nn             | Norwegian (Nynorsk)                        |
| nso            | Sesotho sa Leboa                           |
| or             | Odia                                       |
| pa             | Punjabi (Gurmukhi)                         |
| pa-Arab        | Punjabi (Arabic)                           |
| pl             | Polish                                     |
| prs-Arab       | Dari                                       |
| pt-BR          | Portuguese (Brazil)                        |
| pt-PT          | Portuguese (Portugal)                      |
| qut-Latn       | K’iche’                                    |
| quz            | Quechua (Peru)                             |
| ro             | Romanian (Romania)                         |
| ru             | Russian                                    |
| rw             | Kinyarwanda                                |
| sd-Arab        | Sindhi (Arabic)                            |
| si             | Sinhala                                    |
| sk             | Slovak                                     |
| sl             | Slovenian                                  |
| sq             | Albanian                                   |
| sr-Cyrl-BA     | Serbian (Cyrillic, Bosnia and Herzegovina) |
| sr-Cyrl-RS     | Serbian (Cyrillic, Serbia)                 |
| sr-Latn-RS     | Serbian (Latin, Serbia)                    |
| sv             | Swedish (Sweden)                           |
| sw             | Kiswahili                                  |
| ta             | Tamil                                      |
| te             | Telugu                                     |
| tg-Cyrl        | Tajik (Cyrillic)                           |
| th             | Thai                                       |
| ti             | Tigrinya                                   |
| tk-Latn        | Turkmen (Latin)                            |
| tn             | Setswana                                   |
| tr             | Turkish                                    |
| tt-Cyrl        | Tatar (Cyrillic)                           |
| ug-Arab        | Uyghur                                     |
| uk             | Ukrainian                                  |
| ur             | Urdu                                       |
| uz-Latn        | Uzbek (Latin)                              |
| vi             | Vietnamese                                 |
| wo             | Wolof                                      |
| xh             | isiXhosa                                   |
| yo-Latn        | Yoruba                                     |
| zh-Hans        | Chinese (Simplified)                       |
| zh-Hant        | Chinese (Traditional)                      |
| zu             | isiZulu                                    |
