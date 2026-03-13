import type { Header } from '@/payload-types'
import { getCachedGlobal } from '@/utils/getGlobals'
import { HeaderClient } from './index.client'

export async function Header() {
  const headerData: Header = await (await getCachedGlobal('header', 1))()

  return <HeaderClient data={headerData} />
}
