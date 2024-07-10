import type { ReadonlyURLSearchParams } from 'next/navigation'

export const createUrl = (pathname: string, params: ReadonlyURLSearchParams | URLSearchParams) => {
  const paramsString = params.toString()
  const queryString = `${paramsString.length ? '?' : ''}${paramsString}`

  return `${pathname}${queryString}`
}

export const ensureStartsWith = (stringToCheck: string, startsWith: string) =>
  stringToCheck.startsWith(startsWith) ? stringToCheck : `${startsWith}${stringToCheck}`

export const validateEnvironmentVariables = () => {
  const requiredEnvironmentVariables = [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOKS_SIGNING_SECRET',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  ]
  const missingEnvironmentVariables = [] as string[]

  requiredEnvironmentVariables.forEach((envVar) => {
    if (!process.env[envVar]) {
      missingEnvironmentVariables.push(envVar)
    }
  })

  if (missingEnvironmentVariables.length) {
    throw new Error(
      `The following environment variables are missing. Your site will not work without them. \n\n${missingEnvironmentVariables.join(
        '\n',
      )}\n`,
    )
  }
}
