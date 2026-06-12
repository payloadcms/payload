import type { PluginLanguage } from '../types.js'

export const huTranslations = {
  'plugin-mcp': {
    apiKeyDescription: 'Az API-kulcsok szabályozzák, hogy az MCP-kliensek mely gyűjteményekhez, erőforrásokhoz, eszközökhöz és promptokhoz férhetnek hozzá.',
    apiKeys: 'API-kulcsok',
    authentication: 'Hitelesítés',
    description: 'Leírás',
    descriptionDescription: 'Írd le az API-kulcs célját.',
    dismiss: 'Bezárás',
    keepKeyPrivate: 'Tartsd titokban a kulcsodat.',
    keyPrivateDescription: 'Ez a kulcs hozzáférést ad az MCP-nek a tartalmadhoz. Ne oszd meg másokkal!',
    lastUsed: 'Utoljára használva',
    manageAPIKeys: 'API-kulcsok kezelése',
    mcp: 'MCP',
    noAPIKeys: 'Nincsenek API-kulcsok',
    operations: 'Műveletek',
    overrideAccess: 'Hozzáférés-vezérlés felülírása',
    overrideAccessDescription: 'Ha be van jelölve, ez a kulcs minden műveletnél megkerüli a Payload hozzáférési szabályait. Hagyd kikapcsolva, hacsak nincs konkrét okod.',
    permissions: 'Jogosultságok',
    permissionsDescription: 'Engedélyezd az MCP-klienseknek az alábbi gyűjtemények, eszközök, erőforrások és promptok elérését.',
    prompts: 'Promptok',
    resources: 'Erőforrások',
    server: 'Szerver',
    title: 'Cím',
    titleDescription: 'Hasznos becenév az API-kulcshoz.',
    tools: 'Eszközök',
    userDescription: 'A felhasználó, akinek a nevében az MCP eljár.',
  },
}

export const hu: PluginLanguage = {
  dateFNSKey: 'hu',
  translations: huTranslations,
}
