import type { PluginLanguage } from '../types.js'

export const lvTranslations = {
  'plugin-mcp': {
    apiKey: 'API atslēga',
    apiKeyDescription: 'API atslēgas nosaka, kurām kolekcijām, resursiem, rīkiem un promptiem MCP klienti var piekļūt.',
    apiKeys: 'API atslēgas',
    authentication: 'Autentifikācija',
    collections: 'Kolekcijas',
    custom: 'Pielāgots',
    description: 'Apraksts',
    descriptionDescription: 'Aprakstiet API atslēgas mērķi.',
    dismiss: 'Aizvērt',
    generateAPIKey: 'Ģenerēt API atslēgu',
    generateNewKey: 'Ģenerēt jaunu atslēgu',
    globals: 'Globālie',
    keepKeyPrivate: 'Glabājiet savu atslēgu privāti.',
    keyPrivateDescription: 'Šī atslēga dod MCP piekļuvi jūsu saturam. Nekopīgojiet to ar citiem!',
    lastUsed: 'Pēdējo reizi lietots',
    manageAPIKeys: 'Pārvaldīt API atslēgas',
    mcp: 'MCP',
    noAPIKeys: 'Nav API atslēgu',
    operations: 'Darbības',
    overrideAccess: 'Apiet piekļuves kontroli',
    overrideAccessDescription: 'Ja atzīmēts, šī atslēga apiet Payload piekļuves kontroli katrā darbībā. Atstājiet neatzīmētu, ja nav konkrēta iemesla.',
    owner: 'Īpašnieks',
    permissions: 'Atļaujas',
    permissionsDescription: 'Atļaujiet MCP klientiem piekļūt šādām kolekcijām, rīkiem, resursiem un promptiem.',
    prompts: 'Prompti',
    resources: 'Resursi',
    server: 'Serveris',
    title: 'Nosaukums',
    titleDescription: 'Noderīgs API atslēgas segvārds.',
    tools: 'Rīki',
    userDescription: 'Lietotājs, kura vārdā MCP darbosies.',
  },
}

export const lv: PluginLanguage = {
  dateFNSKey: 'lv',
  translations: lvTranslations,
}
