import { FC } from 'react'
import Image from 'next/image'
import Link from 'next/link'

import { Profile } from '../../../payload-types'
import { PayloadLogo } from '../../_assets/payloadLogo'
import { SocialIcons } from '../content/socialIcons'
import { ThemeToggle } from './themeToggle'

interface FooterProps {
  profile: Profile
}

export const Footer: FC<FooterProps> = ({ profile }) => {
  return (
    <div className="p-12 mt-12 lg:mt-20 flex flex-col lg:flex-row lg:justify-between items-center w-full max-w-[1300px] text-primary">
      <div className="flex justify-center items-center gap-4 ">
        <PayloadLogo />
        <p>
          Website made with{' '}
          <Link href="https://payloadcms.com" className="underline" target="_payload">
            Payload
          </Link>
        </p>
      </div>
      <div className="flex flex-col lg:flex-row items-center gap-8">
        <div className="w-full mt-6 lg:mt-0 lg:max-w-[175px]">
          <SocialIcons profile={profile} className="justify-center lg:justify-end" />
        </div>
        <ThemeToggle />
      </div>
    </div>
  )
}
