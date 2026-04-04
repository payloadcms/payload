import type { AdminViewServerProps, PayloadComponent } from 'payload'
import type React from 'react'

export type ViewFromConfig = {
  Component?: React.FC<AdminViewServerProps>
  payloadComponent?: PayloadComponent<AdminViewServerProps>
}
