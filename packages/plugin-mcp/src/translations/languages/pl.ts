import type { PluginLanguage } from '../types.js'

export const plTranslations = {
  'plugin-mcp': {
    apiKey: 'Klucz API',
    apiKeyDescription: 'Klucze API kontrolują, do których kolekcji, zasobów, narzędzi i promptów klienci MCP mają dostęp.',
    apiKeys: 'Klucze API',
    authentication: 'Uwierzytelnianie',
    collections: 'Kolekcje',
    custom: 'Niestandardowe',
    description: 'Opis',
    descriptionDescription: 'Opisz przeznaczenie klucza API.',
    dismiss: 'Zamknij',
    generateAPIKey: 'Wygeneruj klucz API',
    generateNewKey: 'Wygeneruj nowy klucz',
    globals: 'Globalne',
    keepKeyPrivate: 'Zachowaj swój klucz w tajemnicy.',
    keyPrivateDescription: 'Ten klucz daje MCP dostęp do Twoich treści. Nie udostępniaj go innym!',
    lastUsed: 'Ostatnio użyty',
    manageAPIKeys: 'Zarządzaj kluczami API',
    mcp: 'MCP',
    noAPIKeys: 'Brak kluczy API',
    operations: 'Operacje',
    owner: 'Właściciel',
    overrideAccess: 'Pomiń kontrolę dostępu',
    overrideAccessDescription: 'Po zaznaczeniu ten klucz omija kontrolę dostępu Payload przy każdej operacji. Pozostaw niezaznaczone, chyba że masz konkretny powód.',
    permissions: 'Uprawnienia',
    permissionsDescription: 'Zezwól klientom MCP na dostęp do następujących kolekcji, narzędzi, zasobów i promptów.',
    prompts: 'Prompty',
    resources: 'Zasoby',
    server: 'Serwer',
    title: 'Tytuł',
    titleDescription: 'Przydatna nazwa klucza API.',
    tools: 'Narzędzia',
    userDescription: 'Użytkownik, w imieniu którego będzie działać MCP.',
  },
}

export const pl: PluginLanguage = {
  dateFNSKey: 'pl',
  translations: plTranslations,
}
