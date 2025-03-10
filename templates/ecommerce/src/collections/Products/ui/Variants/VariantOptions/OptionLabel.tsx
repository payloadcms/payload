import { suggestions } from '@/collections/Products/ui/Variants/VariantOptions/shared'
import { FieldDescription, FieldLabel, PlusIcon, Popup, PopupList, TextInput } from '@payloadcms/ui'

type OptionLabelProps = {
  readonly parentPath: string
  readonly setValue: (value: string) => void
  readonly value: string
  readonly slug: string
  readonly description: string
}

const baseClass = 'optionLabel'

export const OptionLabel: React.FC<OptionLabelProps> = (props) => {
  const { parentPath, setValue, value, description } = props

  const path = `${parentPath}.label`

  return (
    <div className={`${baseClass}Wrapper`}>
      <FieldLabel label="Label" path={path} />
      <div className={`${baseClass}Input`}>
        <TextInput
          onChange={(e) => {
            setValue(e.target.value)
          }}
          path={path}
          value={value}
        />
        <Popup
          button={
            <span className={`${baseClass}AddNew`}>
              <PlusIcon />
            </span>
          }
          render={({ close: closePopup }) => (
            <PopupList.ButtonGroup>
              {suggestions.map((suggestion) => (
                <PopupList.Button
                  className={`${baseClass}__relation-button--${suggestion.slug}`}
                  key={suggestion.slug}
                  onClick={() => {
                    setValue(suggestion.label)
                    closePopup()
                  }}
                >
                  {suggestion.label}
                </PopupList.Button>
              ))}
            </PopupList.ButtonGroup>
          )}
        />
      </div>
      <FieldDescription description={description} path={path} />
    </div>
  )
}
