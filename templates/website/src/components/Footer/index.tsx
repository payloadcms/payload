import { getCachedGlobal } from 'src/utils/getGlobals'
import type { Footer as FooterType } from 'src/payload-types'
import { FooterClient } from './index.client'

export async function Footer() {
  const footerData: FooterType = await (await getCachedGlobal('footer', 1))()

  return <FooterClient data={footerData} />
}
