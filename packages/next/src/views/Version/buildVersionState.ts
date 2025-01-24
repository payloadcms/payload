import type { FieldTypes, PayloadComponent } from 'payload'

export type VersionState = {}

type Args = {
  customDiffComponents: Record<FieldTypes, PayloadComponent<null, null>>
}

export const buildVersionState = ({ customDiffComponents }: Args): VersionState => {
  return {}
}
