import LinkImport from 'next/link.js'

const Link = (LinkImport.default || LinkImport) as unknown as typeof LinkImport.default

export const LinkTransition: React.FC<Parameters<typeof Link>[0]> = (props) => {
  return <Link {...props} />
}
