import { keyValuePairToHtmlTable } from './keyValuePairToHtmlTable.js'

interface EmailVariable {
  field: string
  value: string
}

type EmailVariables = EmailVariable[]

export const replaceDoubleCurlys = (str: string, variables?: EmailVariables): string => {
  const regex = /\{\{(.+?)\}\}/g
  if (str && variables) {
    return str.replace(regex, (_, variable: string) => {
      if (variable.includes('*')) {
        if (variable === '*') {
          return variables.map(({ field, value }) => `${field} : ${value}`).join(' <br /> ')
        } else if (variable === '*:table') {
          return keyValuePairToHtmlTable(
            variables.reduce<Record<string, string>>((acc, { field, value }) => {
              acc[field] = value
              return acc
            }, {}),
          )
        }
      } else {
        const foundVariable = variables.find(({ field: fieldName }) => {
          return variable === fieldName
        })
        if (foundVariable) {
          return foundVariable.value
        }
      }

      return variable
    })
  }
  return str
}
