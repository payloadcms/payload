import { MAIN_BRANCH } from 'payload/shared'

/** Carries the current branch onto admin destinations unless they select a branch explicitly. */
export function getBranchURL({
  adminRoute,
  branch,
  currentURL,
  href,
}: {
  adminRoute: string
  branch: string
  currentURL: string
  href: string
}): string {
  const current = new URL(currentURL)
  let destination: URL

  try {
    destination = new URL(href, current)
  } catch {
    return href
  }

  const adminPath = adminRoute === '/' ? '' : adminRoute.replace(/\/$/, '')

  if (
    destination.origin !== current.origin ||
    (destination.pathname !== adminPath && !destination.pathname.startsWith(`${adminPath}/`)) ||
    destination.searchParams.has('branch') ||
    branch === MAIN_BRANCH
  ) {
    return href
  }

  destination.searchParams.set('branch', branch)

  return (href.startsWith('/') && !href.startsWith('//')) ||
    href.startsWith('?') ||
    href.startsWith('#')
    ? `${destination.pathname}${destination.search}${destination.hash}`
    : destination.href
}
