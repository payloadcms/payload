'use client'

import { useSearchParams } from 'next/navigation'

import { Message } from '../Message'

export const RenderParams: React.FC<{
  params?: string[]
  message?: string
  className?: string
}> = ({ params = ['error', 'message', 'success'], message, className }) => {
  const searchParams = useSearchParams()
  const paramValues = params.map(param => searchParams.get(param)).filter(Boolean)

  if (paramValues.length) {
    return (
      <div className={className}>
        {paramValues.map(paramValue => (
          <Message
            key={paramValue}
            message={(message || 'PARAM')?.replace('PARAM', paramValue || '')}
          />
        ))}
      </div>
    )
  }

  return null
}
