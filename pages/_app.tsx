import type { AppProps } from 'next/app'
import '../styles/globals.css'
import '../mes-universal-table/mes-universal-table.css'

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}
