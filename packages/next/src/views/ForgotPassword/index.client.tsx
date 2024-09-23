'use client'
import { Translation, useTranslation } from '@payloadcms/ui'
import { formatAdminURL } from '@payloadcms/ui/shared'
import LinkImport from 'next/link.js'

const Link = (LinkImport.default || LinkImport) as unknown as typeof LinkImport.default

type ForgotPasswordClientProps = {
  readonly accountRoute: string
  readonly adminRoute: string
}

export const ForgotPasswordClient: React.FC<ForgotPasswordClientProps> = ({
  accountRoute,
  adminRoute,
}) => {
  const { t } = useTranslation()

  return (
    <Translation
      elements={{
        '0': ({ children }) => (
          <Link
            href={formatAdminURL({
              adminRoute,
              path: accountRoute,
            })}
          >
            {children}
          </Link>
        ),
      }}
      i18nKey="authentication:loggedInChangePassword"
      t={t}
    />
  )
}
