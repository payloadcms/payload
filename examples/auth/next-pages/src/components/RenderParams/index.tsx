import { useRouter } from 'next/router'

import { Message } from '../Message'

export const RenderParams: React.FC<{
  params?: string[]
  message?: string
  className?: string
}> = ({ params = ['error', 'message', 'success'], message, className }) => {
  const router = useRouter()
  const searchParams = new URLSearchParams(router.query as any)
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
