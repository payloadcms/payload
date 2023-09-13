import Link from 'next/link'

interface SocialLinkProps {
  href: string
  icon: React.ReactNode
  target?: string
}

export const SocialLink = ({ icon, href, target }: SocialLinkProps) => {
  return (
    <Link
      href={href}
      className="text-primary active:text-primary/50 hover:-translate-y-1 transition-all"
      target={target}
    >
      {icon}
    </Link>
  )
}
