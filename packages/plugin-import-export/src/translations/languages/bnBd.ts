import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const bnBdTranslations: PluginDefaultTranslationsObject = {
  'plugin-import-export': {
    allLocales: 'সমস্ত লোকেল',
    collectionRequired: 'প্রিভিউ দেখানোর জন্য সংগ্রহণ প্রয়োজন',
    exportDocumentLabel: '{{label}} রপ্তানি করুন',
    exportOptions: 'রপ্তানি বিকল্পসমূহ',
    'field-collectionSlug-label': 'সংগ্রহ',
    'field-depth-label': 'গভীরতা',
    'field-drafts-label': 'খসড়াগুলি অন্তর্ভুক্ত করুন',
    'field-fields-label': 'ক্ষেত্র',
    'field-format-label': 'রপ্তানি ফরম্যাট',
    'field-importMode-create-label': 'নতুন নথি তৈরি করুন',
    'field-importMode-label': 'আমদানি মোড',
    'field-importMode-update-label': 'বিদ্যমান নথিপত্রগুলি আপডেট করুন',
    'field-importMode-upsert-label': 'নথি তৈরি করুন অথবা আপডেট করুন',
    'field-limit-label': 'সীমা',
    'field-locale-label': 'লোকেল',
    'field-matchField-description': 'বিদ্যমান নথিগুলির সাথে মিলাতে ব্যবহারের জন্য ক্ষেত্র',
    'field-matchField-label': 'মিলে যাওয়া ক্ষেত্র',
    'field-name-label': 'ফাইলের নাম',
    'field-page-label': 'পৃষ্ঠা',
    'field-selectionToUse-label': 'ব্যবহার করতে নির্বাচন করুন',
    'field-sort-label': 'অনুসারে সাজান',
    'field-sort-order-label': 'সাজানোর ক্রম',
    'field-status-label': 'অবস্থা',
    'field-summary-label': 'আমদানি সারাংশ',
    importDocumentLabel: '{{label}} আমদানি করুন',
    importResults: 'আমদানি ফলাফল',
    matchBy: 'দ্বারা মিলান',
    mode: 'মোড',
    noDataToPreview:
      'প্রাথমিক টেক্সটের অর্থ পরিপ্রেক্ষিতে Payload এর সর্বদাহ করুন। এখানে কিছু সাধারণ Payload শব্দের তালিকা যা খুব নির্দিষ্ট অর্থ বহন করে:\n    - সংগ্রহ: এক',
    'selectionToUse-allDocuments': 'সমস্ত নথি ব্যবহার করুন',
    'selectionToUse-currentFilters': 'বর্তমান ফিল্টারগুলি ব্যবহার করুন',
    'selectionToUse-currentSelection':
      'আপনার প্রাসঙ্গিক টেক্সটটি নিচে নিবেশ করুন। এটি পয়সলোডের সন্দর্ভে অর্থটি সম্মান করবে। এখানে কিছু প্রামাণিক পয়সলোড শব্দের',
    startImport: 'আমদানি শুরু করুন',
    totalDocumentsCount: '{{count}} মোট নথি',
    uploadFileToSeePreview: 'প্রিভিউ দেখতে একটি ফাইল আপলোড করুন',
  },
}

export const bnBd: PluginLanguage = {
  dateFNSKey: 'bn-BD',
  translations: bnBdTranslations,
}
