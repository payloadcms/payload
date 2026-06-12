import type { PluginLanguage } from '../types.js'

export const bnBdTranslations = {
  'plugin-mcp': {
    apiKey: 'API কী',
    apiKeyDescription: 'API কী নির্ধারণ করে MCP ক্লায়েন্ট কোন সংগ্রহ, রিসোর্স, টুল এবং প্রম্পটে প্রবেশ করতে পারবে।',
    apiKeys: 'API কীসমূহ',
    authentication: 'প্রমাণীকরণ',
    collections: 'সংগ্রহসমূহ',
    custom: 'কাস্টম',
    description: 'বিবরণ',
    descriptionDescription: 'API কী-এর উদ্দেশ্য লিখুন।',
    dismiss: 'বন্ধ করুন',
    generateAPIKey: 'API কী তৈরি করুন',
    generateNewKey: 'নতুন কী তৈরি করুন',
    globals: 'গ্লোবাল',
    keepKeyPrivate: 'আপনার কী ব্যক্তিগত রাখুন।',
    keyPrivateDescription: 'এই কী MCP-কে আপনার কনটেন্টে প্রবেশাধিকার দেয়। এটি অন্যদের সাথে শেয়ার করবেন না!',
    lastUsed: 'সর্বশেষ ব্যবহৃত',
    manageAPIKeys: 'API কী পরিচালনা করুন',
    mcp: 'MCP',
    noAPIKeys: 'কোনো API কী নেই',
    operations: 'অপারেশনসমূহ',
    owner: 'মালিক',
    overrideAccess: 'অ্যাক্সেস নিয়ন্ত্রণ অগ্রাহ্য করুন',
    overrideAccessDescription: 'চালু থাকলে, এই কী প্রতিটি অপারেশনে Payload অ্যাক্সেস নিয়ম অগ্রাহ্য করবে। নির্দিষ্ট কারণ না থাকলে বন্ধ রাখুন।',
    permissions: 'অনুমতিসমূহ',
    permissionsDescription: 'MCP ক্লায়েন্টকে নিচের সংগ্রহ, টুল, রিসোর্স এবং প্রম্পটে প্রবেশের অনুমতি দিন।',
    prompts: 'প্রম্পটসমূহ',
    resources: 'রিসোর্সসমূহ',
    server: 'সার্ভার',
    title: 'শিরোনাম',
    titleDescription: 'API কী-এর জন্য একটি সহায়ক ডাকনাম।',
    tools: 'টুলসমূহ',
    userDescription: 'MCP যে ব্যবহারকারীর পক্ষ থেকে কাজ করবে।',
  },
}

export const bnBd: PluginLanguage = {
  dateFNSKey: 'bn-BD',
  translations: bnBdTranslations,
}
