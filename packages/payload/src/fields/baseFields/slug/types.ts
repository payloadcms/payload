import type { TextFieldClientProps } from '../../../admin/types.js'
import type { TypeWithID } from '../../../collections/config/types.js'
import type { PayloadRequest } from '../../../types/index.js'

export type Slugify<T extends TypeWithID = any> = (args: {
  data: T
  req: PayloadRequest
  valueToSlugify?: any
}) => Promise<string | undefined> | string | undefined

/**
 * Props the `SlugField` client component receives. The slug-specific `useAsSlug`
 * arrives on the client field config (it is not a server-only property).
 */
export type SlugFieldClientProps = TextFieldClientProps
