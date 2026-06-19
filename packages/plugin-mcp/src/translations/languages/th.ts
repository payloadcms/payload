import type { PluginLanguage } from '../types.js'

export const thTranslations = {
  'plugin-mcp': {
    apiKeyDescription:
      'คีย์ API ควบคุมว่าลูกค้า MCP สามารถเข้าถึงคอลเลกชัน ทรัพยากร เครื่องมือ และพรอมป์ใดได้บ้าง',
    apiKeys: 'คีย์ API',
    authentication: 'การยืนยันตัวตน',
    description: 'คำอธิบาย',
    descriptionDescription: 'อธิบายวัตถุประสงค์ของคีย์ API',
    dismiss: 'ปิด',
    keepKeyPrivate: 'เก็บคีย์ของคุณไว้เป็นความลับ',
    keyPrivateDescription: 'คีย์นี้ให้ MCP เข้าถึงเนื้อหาของคุณ อย่าแชร์กับผู้อื่น!',
    lastUsed: 'ใช้ล่าสุด',
    manageAPIKeys: 'จัดการคีย์ API',
    mcp: 'MCP',
    noAPIKeys: 'ไม่มีคีย์ API',
    operations: 'การดำเนินการ',
    overrideAccess: 'ข้ามการควบคุมการเข้าถึง',
    overrideAccessDescription:
      'เมื่อเลือก คีย์นี้จะข้ามการควบคุมการเข้าถึงของ Payload ในทุกการดำเนินการ เว้นไว้หากไม่มีเหตุผลเฉพาะ',
    permissions: 'สิทธิ์',
    permissionsDescription:
      'อนุญาตให้ลูกค้า MCP เข้าถึงคอลเลกชัน เครื่องมือ ทรัพยากร และพรอมป์ต่อไปนี้',
    prompts: 'พรอมป์',
    resources: 'ทรัพยากร',
    server: 'เซิร์ฟเวอร์',
    title: 'ชื่อ',
    titleDescription: 'ชื่อเล่นที่ช่วยจำสำหรับคีย์ API',
    tools: 'เครื่องมือ',
    userDescription: 'ผู้ใช้ที่ MCP จะดำเนินการแทน',
  },
}

export const th: PluginLanguage = {
  dateFNSKey: 'th',
  translations: thTranslations,
}
