import { getCachedGlobal } from 'src/utils/getGlobals'
import type { Header as HeaderType } from 'src/payload-types'
import { HeaderClient } from './index.client'

export async function Header() {
  const headerData: HeaderType = await (await getCachedGlobal('header', 1))()

  return <HeaderClient data={headerData} />
}
