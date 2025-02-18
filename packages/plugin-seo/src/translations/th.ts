import type { GenericTranslationsObject } from '@payloadcms/translations'

export const th: GenericTranslationsObject = {
  $schema: './translation-schema.json',
  'plugin-seo': {
    almostThere: 'เกือบเสร็จแล้ว',
    autoGenerate: 'สร้างอัตโนมัติ',
    bestPractices: 'แนวปฏิบัติที่ดีที่สุด',
    characterCount: '{{current}}/{{minLength}}-{{maxLength}} ตัวอักษร, ',
    charactersLeftOver: '{{characters}} ตัวอักษรที่เหลือ',
    charactersToGo: '{{characters}} ตัวอักษรที่ต้องการ',
    charactersTooMany: '{{characters}} ตัวอักษรเกินไป',
    checksPassing: '{{current}}/{{max}} การตรวจสอบสำเร็จ',
    good: 'ดี',
    imageAutoGenerationTip: 'การสร้างอัตโนมัติจะดึงภาพหลักที่เลือก',
    lengthTipDescription:
      'ข้อความนี้ควรมีระหว่าง {{minLength}} และ {{maxLength}} ตัวอักษร สำหรับคำแนะนำในการเขียนคำอธิบายเมตาคุณภาพสูง โปรดดูที่ ',
    lengthTipTitle:
      'ข้อความนี้ควรมีระหว่าง {{minLength}} และ {{maxLength}} ตัวอักษร สำหรับคำแนะนำในการเขียนหัวข้อเมตาคุณภาพสูง โปรดดูที่ ',
    missing: 'ขาดหายไป',
    noImage: 'ไม่มีภาพ',
    preview: 'ตัวอย่าง',
    previewDescription:
      'ผลลัพธ์การค้นหาที่แท้จริงอาจแตกต่างกันไปตามเนื้อหาและความเกี่ยวข้องของการค้นหา',
    tooLong: 'ยาวเกินไป',
    tooShort: 'สั้นเกินไป',
  },
}
