import { canUseDOM } from './canUseDOM'

export const getDocumentCookie = (key: string): string | null | undefined => {
  if (!canUseDOM) return null
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${key}=`))
    ?.split('=')[1]
}
