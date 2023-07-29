'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

import { Message } from '../Message'

export type Props = {
  params?: string[]
  message?: string
  className?: string
  onParams?: (paramValues: (string | string[])[]) => void
}

export const RenderParamsComponent: React.FC<Props> = ({
  params = ['error', 'message', 'success'],
  message,
  className,
  onParams,
}) => {
  const searchParams = useSearchParams()
  const paramValues = params.map(param => searchParams.get(param)).filter(Boolean)

  useEffect(() => {
    if (paramValues.length && onParams) {
      onParams(paramValues)
    }
  }, [paramValues, onParams])

  if (paramValues.length) {
    return (
      <div className={className}>
        {paramValues.map(paramValue => (
          <Message key={paramValue} message={(message || 'PARAM')?.replace('PARAM', paramValue)} />
        ))}
      </div>
    )
  }

  return null
}
