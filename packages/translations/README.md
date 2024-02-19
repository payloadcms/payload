# Payload Translations

These are the translations for Payload. Translations are used on both the server and the client. The admin panel uses translations to display text to the user in their selected language. The server uses translations when sending API responses.

## How to contribute

#### Updating a translation
1. Open the language file you wish to edit located within the `src/all` folder
2. Update the translation value
3. Run one of the following:
    ```sh
    yarn build
    // or
    npm build
    // or
    pnpm build
    ```

#### Adding a new translation
1. Add the new translation key/value pair for all languages located in the `src/all` folder
2. Open the `src/build.ts` file and add the key to either `clientTranslationKeys` or `serverTranslationKeys` depending on where the translation will be used.
3. Run one of the following:
    ```sh
    yarn build
    // or
    npm build
    // or
    pnpm build
    ```

#### Adding a new language
1. Create a new JSON file in the `src/all` folder with the language code as the file name (e.g. `en.json` for English)
2. Translate all of the keys in the new file
3. Open the `src/index.ts` file and import your json file and then export it inside the `translations` object
4. Run one of the following:
    ```sh
    yarn build
    // or
    npm build
    // or
    pnpm build
    ```
