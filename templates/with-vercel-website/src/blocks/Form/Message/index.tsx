import RichText from '@/components/RichText'
import React from 'react'

import { Width } from '../Width'
import type { Message as MessageBlockProps } from '@/payload-types'

export const Message: React.FC<{ message: MessageBlockProps['message'] }> = ({ message }) => {
  return (
    <Width className="my-12" width="100">
      {message && <RichText data={message} />}
    </Width>
  )
}
