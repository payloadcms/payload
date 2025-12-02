import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const bnBdTranslations: PluginDefaultTranslationsObject = {
  'plugin-import-export': {
    allLocales: undefined,
    collectionRequired: 'প্রিভিউ দেখানোর জন্য সংগ্রহ প্রয়োজন',
    exportDocumentLabel: undefined,
    exportOptions: undefined,
    'field-collectionSlug-label': 'সংগ্রহ',
    'field-depth-label': undefined,
    'field-drafts-label': 'খসড়া অন্তর্ভুক্ত করুন',
    'field-fields-label': 'ক্ষেত্রগুলি',
    'field-format-label': 'রপ্তানি ফরম্যাট',
    'field-importMode-create-label': 'নতুন ডকুমেন্ট তৈরি করুন',
    'field-importMode-label': 'আমদানি মোড',
    'field-importMode-update-label': 'বিদ্যমান নথিপত্রগুলি আপডেট করুন',
    'field-importMode-upsert-label': 'নথি তৈরি করুন বা আপডেট করুন',
    'field-limit-label': 'সীমা',
    'field-locale-label': 'ভাষা',
    'field-matchField-description': 'বিদ্যমান নথিগুলির সাথে মিল করার জন্য ক্ষেত্র ব্যবহার করুন',
    'field-matchField-label': 'মিল ক্ষেত্র',
    'field-name-label': 'ফাইলের নাম',
    'field-page-label': 'পাতা',
    'field-selectionToUse-label': 'ব্যবহারের জন্য নির্বাচন করুন',
    'field-sort-label': 'অনুসারে সাজান',
    'field-sort-order-label': 'সাজানোর ক্রম',
    'field-status-label': 'অবস্থা',
    'field-summary-label': 'আমদানি সারাংশ',
    importDocumentLabel: '{{label}} আমদানি করুন',
    importResults: 'ফলাফল আমদানি করুন',
    matchBy: 'মিলিত করা',
    mode: 'মোড',
    noDataToPreview:
      'পেইলোডের প্রাসঙ্গিকতার মধ্যে মূল পাঠের অর্থ সম্মান করুন। এখানে কিছু সাধারণ পেইলোড পদ তথ্য দেওয়া হল যাদের খুবই নির্দিষ্ট',
    'selectionToUse-allDocuments': 'সমস্ত নথিগুলি ব্যবহার করুন',
    'selectionToUse-currentFilters': 'বর্তমান ফিল্টারগুলি ব্যবহার করুন',
    'selectionToUse-currentSelection': 'বর্তমান নির্বাচন ব্যবহার করুন',
    startImport: undefined,
    totalDocumentsCount: '{{count}} টি মোট ডকুমেন্ট',
    uploadFileToSeePreview: 'প্রিভিউ দেখতে ফাইল আপলোড করুন',
  },
}

export const bnBd: PluginLanguage = {
  dateFNSKey: 'bn-BD',
  translations: bnBdTranslations,
}
