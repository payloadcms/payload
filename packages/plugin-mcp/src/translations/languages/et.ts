import type { PluginLanguage } from '../types.js'

export const etTranslations = {
  'plugin-mcp': {
    apiKeyDescription:
      'API võtmed määravad, millistele kogudele, ressurssidele, tööriistadele ja promptidele MCP kliendid ligi pääsevad.',
    apiKeys: 'API võtmed',
    authentication: 'Autentimine',
    description: 'Kirjeldus',
    descriptionDescription: 'Kirjelda API võtme eesmärki.',
    dismiss: 'Sulge',
    keepKeyPrivate: 'Hoia oma võti privaatsena.',
    keyPrivateDescription: 'See võti annab MCP-le juurdepääsu sinu sisule. Ära jaga seda teistega!',
    lastUsed: 'Viimati kasutatud',
    manageAPIKeys: 'Halda API võtmeid',
    mcp: 'MCP',
    noAPIKeys: 'API võtmeid pole',
    operations: 'Toimingud',
    overrideAccess: 'Tühista juurdepääsukontroll',
    overrideAccessDescription:
      'Kui see on märgitud, möödub võti igas toimingus Payloadi juurdepääsureeglitest. Jäta märkimata, kui sul pole konkreetset põhjust.',
    permissions: 'Õigused',
    permissionsDescription:
      'Luba MCP klientidel pääseda ligi järgmistele kogudele, tööriistadele, ressurssidele ja promptidele.',
    prompts: 'Promptid',
    resources: 'Ressursid',
    server: 'Server',
    title: 'Pealkiri',
    titleDescription: 'Kasulik hüüdnimi API võtmele.',
    tools: 'Tööriistad',
    userDescription: 'Kasutaja, kelle nimel MCP tegutseb.',
  },
}

export const et: PluginLanguage = {
  dateFNSKey: 'et',
  translations: etTranslations,
}
