import type React from 'react'

export type Feature = {
  floatingSelectToolbar?: {
    buttons?: {
      format?: {
        children: React.FC<any>
      }[]
    }
  }
}
