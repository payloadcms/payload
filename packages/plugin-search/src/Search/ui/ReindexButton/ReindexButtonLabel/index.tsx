import { ChevronIcon, Pill, useTranslation } from '@payloadcms/ui'

export const ReindexButtonLabel = () => {
  const {
    i18n: { t },
  } = useTranslation()
  return (
    <Pill className="pill--has-action" icon={<ChevronIcon />} pillStyle="light">
      {t('general:reindex')}
    </Pill>
  )
}
