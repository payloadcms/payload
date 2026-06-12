import type { PluginLanguage } from '../types.js'

export const hyTranslations = {
  'plugin-mcp': {
    apiKeyDescription: 'API բանալիները կառավարում են, թե MCP հաճախորդները որ հավաքածուներին, ռեսուրսներին, գործիքներին և prompt-երին կարող են մուտք ունենալ։',
    apiKeys: 'API բանալիներ',
    authentication: 'Նույնականացում',
    description: 'Նկարագրություն',
    descriptionDescription: 'Նկարագրեք API բանալիի նպատակը։',
    dismiss: 'Փակել',
    keepKeyPrivate: 'Ձեր բանալին պահեք գաղտնի։',
    keyPrivateDescription: 'Այս բանալին MCP-ին հասանելիություն է տալիս ձեր բովանդակությանը։ Մի՛ կիսվեք այն ուրիշների հետ։',
    lastUsed: 'Վերջին օգտագործում',
    manageAPIKeys: 'Կառավարել API բանալիները',
    mcp: 'MCP',
    noAPIKeys: 'API բանալիներ չկան',
    operations: 'Գործողություններ',
    overrideAccess: 'Շրջանցել հասանելիության վերահսկումը',
    overrideAccessDescription: 'Միացված լինելու դեպքում այս բանալին շրջանցում է Payload-ի հասանելիության կանոնները յուրաքանչյուր գործողության ժամանակ։ Թողեք անջատված, եթե հատուկ պատճառ չունեք։',
    permissions: 'Թույլտվություններ',
    permissionsDescription: 'Թույլ տվեք MCP հաճախորդներին մուտք ունենալ հետևյալ հավաքածուներին, գործիքներին, ռեսուրսներին և prompt-երին։',
    prompts: 'Prompt-եր',
    resources: 'Ռեսուրսներ',
    server: 'Սերվեր',
    title: 'Վերնագիր',
    titleDescription: 'Օգտակար մականուն API բանալիի համար։',
    tools: 'Գործիքներ',
    userDescription: 'Օգտատերը, որի անունից գործելու է MCP-ն։',
  },
}

export const hy: PluginLanguage = {
  dateFNSKey: 'hy-AM',
  translations: hyTranslations,
}
