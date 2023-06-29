type Type = 'text' | 'country' | 'state' | 'select' | 'email' | 'textarea' | 'checkbox' | 'message'

export const FORM_FIELD = (type: Type): string => `{
    id
    name
    label
    width
    required
    blockType
    ${
      type !== 'email' && type !== 'checkbox' && type !== 'country' && type !== 'state'
        ? `defaultValue`
        : ''
    }
    ${type === 'checkbox' ? `checkboxDefaultValue: defaultValue` : ''}
    ${
      type === 'select'
        ? `options {
        label
        value
    }`
        : ''
    }

}`

export const FORM_FIELDS = `{
   id
   title
   fields {
        ...on Text ${FORM_FIELD('text')}
        ...on Textarea ${FORM_FIELD('textarea')}
        ...on Country ${FORM_FIELD('country')}
        ...on State ${FORM_FIELD('state')}
        ...on Email ${FORM_FIELD('email')}
        ...on Checkbox ${FORM_FIELD('checkbox')}
        ...on Select ${FORM_FIELD('select')}
        ...on Message {
            message
            id
            blockName
            blockType
        }
   }
   submitButtonLabel
   confirmationType
   confirmationMessage
   redirect {
    url
   }
}`
