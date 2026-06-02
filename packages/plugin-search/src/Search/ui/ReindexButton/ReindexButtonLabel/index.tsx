import { Button, useTranslation } from '@payloadcms/ui'

export const ReindexButtonLabel = () => {
  const {
    i18n: { t },
  } = useTranslation()
  return (
    <Button buttonStyle="pill" icon="chevron" iconPosition="right" size="medium">
      {t('general:reindex')}
    </Button>
  )
}
