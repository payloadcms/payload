import { ServerSideEncryption } from '@aws-sdk/client-s3'

export interface EncryptionConfig {
  kmsKeyId?: string
  serverSideEncryption?: ServerSideEncryption
}

export const getEncryptionParams = ({
  kmsKeyId,
  serverSideEncryption,
}: EncryptionConfig | undefined = {}) => {
  if (!serverSideEncryption) {
    return {}
  }

  const encryptionParams: {
    ServerSideEncryption: ServerSideEncryption
    SSEKMSKeyId?: string
  } = { ServerSideEncryption: serverSideEncryption }

  if (
    kmsKeyId &&
    (serverSideEncryption === ServerSideEncryption.aws_kms ||
      serverSideEncryption === ServerSideEncryption.aws_kms_dsse)
  ) {
    encryptionParams.SSEKMSKeyId = kmsKeyId
  }

  return encryptionParams
}
