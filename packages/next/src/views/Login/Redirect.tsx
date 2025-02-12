'use client'
import { redirect } from 'next/navigation.js'

export const Redirect = ({ href }: { href: string }) => {
  const { startRouteTransition } = useRouteTransition()

  useEffect(() => {
    console.log('redirecting to', href)
    startRouteTransition(() => {
      redirect(href)
    })
  }, [href, startRouteTransition])

  return null
}
