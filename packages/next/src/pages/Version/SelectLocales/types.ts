import type { Option } from '@payloadcms/ui'

export type Props = {
  onChange: (options: Option[]) => void
  options: Option[]
  value: Option[]
}
