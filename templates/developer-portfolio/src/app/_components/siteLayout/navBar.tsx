import Image from 'next/image'
import Link from 'next/link'

import { Header, Media, Profile } from '../../../payload/payload-types'
import { PayloadLink } from '../content/link'
import { SkipToMainContentLink } from './skipToMainContent'

const HeaderLinks = ({ header }: { header: Header }) => {
  return (
    <>
      {header.navItems?.map(({ id, link }) => (
        <PayloadLink link={link} key={id} />
      ))}
    </>
  )
}

export const NavBar = ({ profile, header }: { profile: Profile; header: Header }) => {
  return (
    <>
      <div className="fixed z-50 bg-background/50 backdrop-blur-[20px] w-full flex justify-center">
        <SkipToMainContentLink />
        <div className="w-full max-w-[1300px] h-16 flex items-center justify-center md:justify-between md:px-8 content-box">
          {profile.profileImage && (
            <Link
              href="/"
              className="hidden sm:block items-center w-10 h-10 my-4"
              style={{ position: 'relative' }}
            >
              <Image
                src={(profile.profileImage as Media).url}
                className="rounded-full"
                alt={(profile.profileImage as Media).alt}
                priority
                fill
                sizes="(min-width: 640px) 10vw, (min-width: 1024px) 5vw"
                style={{ objectFit: 'cover' }}
              />
            </Link>
          )}
          <nav className="flex gap-6 lg:gap-8 w-full max-w-[378px] lg:w-auto justify-center md:justify-end text-base items-center text-primary">
            <HeaderLinks header={header} />
          </nav>
        </div>
      </div>
      <div className="pb-16" />
    </>
  )
}
