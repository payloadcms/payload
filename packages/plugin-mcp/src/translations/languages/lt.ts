import type { PluginLanguage } from '../types.js'

export const ltTranslations = {
  'plugin-mcp': {
    apiKeyDescription: 'API raktai valdo, prie kurių kolekcijų, išteklių, įrankių ir promptų gali prisijungti MCP klientai.',
    apiKeys: 'API raktai',
    authentication: 'Autentifikavimas',
    description: 'Aprašymas',
    descriptionDescription: 'Aprašykite API rakto paskirtį.',
    dismiss: 'Uždaryti',
    keepKeyPrivate: 'Laikykite savo raktą privačiai.',
    keyPrivateDescription: 'Šis raktas suteikia MCP prieigą prie jūsų turinio. Nesidalykite juo su kitais!',
    lastUsed: 'Paskutinį kartą naudota',
    manageAPIKeys: 'Tvarkyti API raktus',
    mcp: 'MCP',
    noAPIKeys: 'Nėra API raktų',
    operations: 'Operacijos',
    overrideAccess: 'Apeiti prieigos kontrolę',
    overrideAccessDescription: 'Pažymėjus, šis raktas apeina Payload prieigos kontrolę kiekvienoje operacijoje. Palikite nepažymėta, nebent turite konkrečią priežastį.',
    permissions: 'Leidimai',
    permissionsDescription: 'Leiskite MCP klientams pasiekti šias kolekcijas, įrankius, išteklius ir promptus.',
    prompts: 'Promptai',
    resources: 'Ištekliai',
    server: 'Serveris',
    title: 'Pavadinimas',
    titleDescription: 'Naudingas API rakto slapyvardis.',
    tools: 'Įrankiai',
    userDescription: 'Naudotojas, kurio vardu veiks MCP.',
  },
}

export const lt: PluginLanguage = {
  dateFNSKey: 'lt',
  translations: ltTranslations,
}
