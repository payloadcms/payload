import type { PluginLanguage } from '../types.js'

export const myTranslations = {
  'plugin-mcp': {
    apiKeyDescription: 'API key များသည် MCP client များ ဝင်ရောက်နိုင်သော collection, resource, tool နှင့် prompt များကို ထိန်းချုပ်သည်။',
    apiKeys: 'API key များ',
    authentication: 'အထောက်အထားစစ်ဆေးခြင်း',
    description: 'ဖော်ပြချက်',
    descriptionDescription: 'API key ၏ ရည်ရွယ်ချက်ကို ဖော်ပြပါ။',
    dismiss: 'ပိတ်ရန်',
    keepKeyPrivate: 'သင့် key ကို လျှို့ဝှက်ထားပါ။',
    keyPrivateDescription: 'ဤ key သည် MCP ကို သင့် content သို့ ဝင်ရောက်ခွင့်ပေးသည်။ အခြားသူများနှင့် မမျှဝေပါနှင့်!',
    lastUsed: 'နောက်ဆုံးအသုံးပြုခဲ့သည်',
    manageAPIKeys: 'API key များကို စီမံရန်',
    mcp: 'MCP',
    noAPIKeys: 'API key မရှိပါ',
    operations: 'လုပ်ဆောင်ချက်များ',
    overrideAccess: 'Access control ကို ကျော်လွန်ရန်',
    overrideAccessDescription: 'ဖွင့်ထားပါက ဤ key သည် ပြုလုပ်သော လုပ်ဆောင်ချက်တိုင်းတွင် Payload access control ကို ကျော်လွန်မည်။ အကြောင်းပြချက်တိကျ မရှိပါက မဖွင့်ပါနှင့်။',
    permissions: 'ခွင့်ပြုချက်များ',
    permissionsDescription: 'MCP client များအား အောက်ပါ collection, tool, resource နှင့် prompt များကို ဝင်ရောက်ခွင့်ပြုပါ။',
    prompts: 'Prompt များ',
    resources: 'Resource များ',
    server: 'Server',
    title: 'ခေါင်းစဉ်',
    titleDescription: 'API key အတွက် အသုံးဝင်သော အမည်တို။',
    tools: 'Tool များ',
    userDescription: 'MCP က ကိုယ်စားပြုလုပ်ဆောင်မည့် user။',
  },
}

export const my: PluginLanguage = {
  dateFNSKey: 'en-US',
  translations: myTranslations,
}
