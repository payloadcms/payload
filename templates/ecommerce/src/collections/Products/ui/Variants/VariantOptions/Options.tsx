import { slugify } from '@/collections/Products/utilities/slugify'
import { FieldLabel, ReactSelect } from '@payloadcms/ui'
import { useCallback, useId, useMemo } from 'react'
import { suggestions } from './shared'

type Props = {
  suggestionSlug?: string
  options: { id?: string; label: string; slug: string }[]
  setOptions: (value: { label: string; slug: string }[]) => void
  setIsModified: (state: boolean) => void
}

export const OptionsSelector: React.FC<Props> = ({
  options,
  suggestionSlug,
  setOptions,
  setIsModified,
}) => {
  const readOnly = false

  const handleHasManyChange = useCallback(
    (selectedOption) => {
      if (!readOnly) {
        let newValue

        if (!selectedOption) {
          newValue = []
        } else if (Array.isArray(selectedOption)) {
          newValue = selectedOption.map((option) => ({
            label: option.label,
            slug: slugify(option.label),
          }))
        } else {
          newValue = [
            {
              label: selectedOption.label,
              slug: slugify(selectedOption.label),
            },
          ]
        }

        setOptions(newValue)
        setIsModified(true)
      }
    },
    [readOnly, setIsModified, setOptions],
  )

  const valueToRender = useMemo(() => {
    if (Array.isArray(options) && options.length > 0) {
      return options.map((value, index) => {
        return {
          id: value.id || `${value.slug}${index}`,
          label: `${value.label}`,
          value: value.slug,
        }
      })
    }

    return []
  }, [options])

  const availableSuggestions = useMemo(() => {
    if (suggestionSlug) {
      const existingSuggestion = suggestions.find(
        (suggestion) => suggestion.slug === suggestionSlug,
      )

      if (existingSuggestion) {
        return existingSuggestion.options
      }
    }

    return []
  }, [suggestionSlug])

  const id = useId()

  return (
    <div>
      <FieldLabel htmlFor={id} label="Options" />
      <ReactSelect
        inputId={id}
        isClearable
        isCreatable
        isMulti
        isSortable
        onChange={handleHasManyChange}
        options={availableSuggestions}
        value={valueToRender}
      />
    </div>
  )
}
