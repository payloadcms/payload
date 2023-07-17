import type { AppProps } from 'next/app'

import { AuthProvider } from '../components/Auth'
import { Header } from '../components/Header'

import './app.scss'

import classes from './index.module.scss'

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    // The `AuthProvider` can be used with either REST or GraphQL APIs
    // Just change the `api` prop to "graphql" or "rest", that's it!
    <AuthProvider api="rest">
      <Header />
      <div className={classes.page}>
        {/* typescript flags this `@ts-expect-error` declaration as unneeded, but types are breaking the build process
      Remove these comments when the issue is resolved
      See more here: https://github.com/facebook/react/issues/24304
      */}
        {/* @ts-expect-error */}
        <Component {...pageProps} />
      </div>
    </AuthProvider>
  )
}
