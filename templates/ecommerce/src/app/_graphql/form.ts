export const CHECKBOX_FIELD = `
... on Checkbox {
  id
  blockName
  blockType
  label
  name
  required
  width
}
`

export const TEXT_FIELD = `
... on Text {
  id
  blockName
  blockType
  label
  name
  required
  width
  defaultValue
}
`

export const TEXTAREA_FIELD = `
... on Textarea {
  id
  blockName
  blockType
  label
  name
  required
  width
  defaultValue
}
`

export const SELECT_FIELD = `
... on Select {
  id
  blockName
  blockType
  label
  name
  required
  width
  options { label value }
  defaultValue
}
`

export const EMAIL_FIELD = `
... on Email {
  id
  blockName
  blockType
  label
  name
  required
  width
}
`

export const STATE_FIELD = `
... on State {
  id
  blockName
  blockType
  label
  name
  required
  width
}
`

export const COUNTRY_FIELD = `
... on Country {
  id
  blockName
  blockType
  label
  name
  required
  width
}
`

export const MESSAGE_FIELD = `
... on Message {
  id
  blockName
  blockType
  message
}
`

export const FORM_FIELDS = `
  ... on Checkbox { ${CHECKBOX_FIELD}  }
  ... on Country { ${COUNTRY_FIELD} }
  ... on Email { ${EMAIL_FIELD} }
  ... on Message { ${MESSAGE_FIELD} }
  ... on Select { ${SELECT_FIELD} }
  ... on State { ${STATE_FIELD} }
  ... on Text { ${TEXT_FIELD} }
  ... on Textarea { ${TEXTAREA_FIELD} }
  `

export const FORM = `form {
    id
    title
    submitButtonLabel
    confirmationType
    confirmationMessage
    redirect {
      url
    }
    emails {
      emailTo
      cc
      bcc
      replyTo
      emailFrom
      subject
      message
      id
    }
    fields {... on Form_Fields { ${FORM_FIELDS} }}
}`
