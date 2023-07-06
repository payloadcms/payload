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
        <Component {...pageProps} />
      </div>
    </AuthProvider>
  )
}
