'use client'

import { useSearchParams } from 'next/navigation'
import React, { useEffect } from 'react'

import { Message } from '../Message'

export type Props = {
  className?: string
  message?: string
  onParams?: (paramValues: ((null | string | undefined) | string[])[]) => void
  params?: string[]
}

export const RenderParamsComponent: React.FC<Props> = ({
  className,
  onParams,
  params = ['error', 'warning', 'success', 'message'],
}) => {
  const searchParams = useSearchParams()
  const paramValues = params.map((param) => searchParams?.get(param))

  useEffect(() => {
    if (paramValues.length && onParams) {
      onParams(paramValues)
    }
  }, [paramValues, onParams])

  if (paramValues.length) {
    return (
      <div className={className}>
        {paramValues.map((paramValue, index) => {
          if (!paramValue) return null

          return (
            <Message
              className="mb-8"
              key={paramValue}
              {...{
                [params[index]]: paramValue,
              }}
            />
          )
        })}
      </div>
    )
  }

  return null
}
