/**
 * Reserved field names for collections with auth config enabled
 */
export const reservedBaseAuthFieldNames = [
  /* 'email',
    'resetPasswordToken',
    'resetPasswordExpiration', */
  'salt',
  'hash',
]

/**
 * Reserved field names for auth collections with verify: true
 */
export const reservedVerifyFieldNames = [
  /* '_verified', '_verificationToken' */
]

/**
 * Reserved field names for auth collections with useApiKey: true
 */
export const reservedAPIKeyFieldNames = [
  /* 'enableAPIKey', 'apiKeyIndex', 'apiKey' */
]

/**
 * Reserved field names for collections with upload config enabled
 */
export const reservedBaseUploadFieldNames = [
  'file',
  /* 'mimeType',
    'thumbnailURL',
    'width',
    'height',
    'filesize',
    'filename',
    'url',
    'focalX',
    'focalY',
    'sizes', */
]

/**
 * Reserved field names for collections with versions enabled
 */
export const reservedVersionsFieldNames = [
  /* '__v', '_status' */
]
