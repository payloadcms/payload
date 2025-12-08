import type { TextField } from 'payload'

export const versioningField: TextField = {
  name: 'storageVersionId',
  type: 'text',
  admin: {
    description: 'S3 Version ID of the uploaded file',
    readOnly: true,
  },
  label: 'Storage Version ID',
}
