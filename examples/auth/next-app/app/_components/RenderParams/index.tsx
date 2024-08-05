'use client'

import { useSearchParams } from 'next/navigation'

import { Message } from '../Message'

type RenderParamsProps = {
  params?: string[]
  message?: string
  className?: string
}

export function RenderParams({
  params = ['error', 'message', 'success'],
  message,
  className,
}: RenderParamsProps) {
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
