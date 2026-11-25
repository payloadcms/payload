'use client'

import React, { useEffect, useRef } from 'react'
import { toast } from 'sonner'

import { CheckboxInput } from '../../../fields/Checkbox/index.js'
import { useAccessibility } from '../../../providers/Accessibility/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'

export const ToggleHelpTooltips: React.FC = () => {
  const { isLoading, isSaving, setShouldShowHelpTooltips, shouldShowHelpTooltips } =
    useAccessibility()
  const { t } = useTranslation()
  const focusedInput = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!isSaving && focusedInput.current) {
      const input = focusedInput.current

      focusedInput.current = null
      // Restore keyboard focus after disabling the input, unless the user moved elsewhere.
      if (document.activeElement === document.body) {
        input.focus()
      }
    }
  }, [isSaving])

  function onToggle(event: React.ChangeEvent<HTMLInputElement>) {
    focusedInput.current = document.activeElement === event.target ? event.target : null
    void setShouldShowHelpTooltips({ shouldShow: event.target.checked }).catch(() =>
      toast.error(t('error:unknown')),
    )
  }

  return (
    <CheckboxInput
      checked={shouldShowHelpTooltips}
      id="field-showHelpTooltips"
      label={t('general:showHelpTooltips')}
      name="showHelpTooltips"
      onToggle={onToggle}
      readOnly={isLoading || isSaving}
    />
  )
}
