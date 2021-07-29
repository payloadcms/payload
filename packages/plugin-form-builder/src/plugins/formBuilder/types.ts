import { Block, CollectionConfig } from 'payload/types';

type BlockConfig = {
  block: Block
  validate?: (value: unknown) => boolean | string
}

export function isValidBlockConfig(blockConfig: BlockConfig | string): blockConfig is BlockConfig {
  return typeof blockConfig !== 'string'
    && typeof blockConfig?.block?.slug === 'string'
    && Array.isArray(blockConfig?.block?.fields);
}

export type FieldType = 'select' | 'text' | 'email' | 'state' | 'country' | 'checkbox'

export type IncomingOptions = {
  fields?: FieldType[]
  formSubmissionsOverrides?: CollectionConfig
  formsOverrides?: CollectionConfig
}

export type SanitizedOptions = {
  fields: (FieldType | BlockConfig)[]
  formSubmissionsOverrides?: CollectionConfig
  formsOverrides?: CollectionConfig
}
