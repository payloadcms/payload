'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

import { Message } from '../Message'

type Props = {
  params?: string[]
  message?: string
  className?: string
}

const RenderParamsComponent: React.FC<Props> = ({
  params = ['error', 'message', 'success'],
  message,
  className,
}) => {
  const searchParams = useSearchParams()
  const paramValues = params.map(param => searchParams.get(param)).filter(Boolean)

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

export const RenderParams: React.FC<Props> = props => {
  return (
    <Suspense fallback={null}>
      <RenderParamsComponent {...props} />
    </Suspense>
  )
}
