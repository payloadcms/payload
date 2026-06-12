import type { PluginLanguage } from '../types.js'

export const taTranslations = {
  'plugin-mcp': {
    apiKeyDescription: 'MCP கிளையன்ட்கள் எந்த collections, resources, tools மற்றும் prompts-ஐ அணுகலாம் என்பதை API விசைகள் கட்டுப்படுத்துகின்றன.',
    apiKeys: 'API விசைகள்',
    authentication: 'அங்கீகாரம்',
    description: 'விளக்கம்',
    descriptionDescription: 'API விசையின் நோக்கத்தை விளக்குங்கள்.',
    dismiss: 'மூடு',
    keepKeyPrivate: 'உங்கள் விசையை தனிப்பட்டதாக வைத்திருங்கள்.',
    keyPrivateDescription: 'இந்த விசை MCP-க்கு உங்கள் உள்ளடக்கத்தை அணுக அனுமதிக்கிறது. இதை பிறருடன் பகிர வேண்டாம்!',
    lastUsed: 'கடைசியாக பயன்படுத்தியது',
    manageAPIKeys: 'API விசைகளை நிர்வகி',
    mcp: 'MCP',
    noAPIKeys: 'API விசைகள் இல்லை',
    operations: 'செயல்பாடுகள்',
    overrideAccess: 'அணுகல் கட்டுப்பாட்டை மீறு',
    overrideAccessDescription: 'இது தேர்ந்தெடுக்கப்பட்டால், இந்த விசை மேற்கொள்ளும் ஒவ்வொரு செயல்பாட்டிலும் Payload அணுகல் கட்டுப்பாட்டை மீறும். குறிப்பிட்ட காரணம் இல்லையெனில் தேர்வு செய்ய வேண்டாம்.',
    permissions: 'அனுமதிகள்',
    permissionsDescription: 'MCP கிளையன்ட்களுக்கு பின்வரும் collections, tools, resources மற்றும் prompts-ஐ அணுக அனுமதிக்கவும்.',
    prompts: 'Prompts',
    resources: 'Resources',
    server: 'சேவையகம்',
    title: 'தலைப்பு',
    titleDescription: 'API விசைக்கு உதவும் ஒரு குறுநாமம்.',
    tools: 'Tools',
    userDescription: 'MCP செயல்படும் பயனர்.',
  },
}

export const ta: PluginLanguage = {
  dateFNSKey: 'ta',
  translations: taTranslations,
}
