import type { ServerProps } from '../../config/types.js'

export type UnpublishButtonClientProps = {
  label?: string
}

export type UnpublishButtonServerPropsOnly = {} & ServerProps

export type UnpublishButtonServerProps = UnpublishButtonServerPropsOnly
