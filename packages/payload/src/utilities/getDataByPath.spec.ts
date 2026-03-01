import { getDataByPath } from './getDataByPath'

const data = {
  text: 'Sample text',
  textLocalized: {
    en: 'Sample text in English',
    fr: 'Exemple de texte en français',
  },
  array: [
    {
      text: 'Array: row 1',
      textLocalized: {
        en: 'Array: row 1 in English',
        fr: "Texte de l'élément 1 du tableau en français",
      },
      group: {
        text: 'Group item text',
      },
    },
    {
      text: 'Array: row 2',
      textLocalized: {
        en: 'Array: row 2 in English',
        fr: "Texte de l'élément 2 du tableau en français",
      },
      group: {
        text: 'Group item text 2',
      },
    },
  ],
  tabs: {
    tab: {
      array: [
        {
          text: 'Tab > Array: row 1',
        },
        {
          text: 'Tab > Array: row 2',
        },
      ],
    },
  },
}

describe('getDataByPath', () => {
  it('gets top-level field', () => {
    const value = getDataByPath({ data, path: 'text' })
    expect(value).toEqual(data.text)
  })

  it('gets localized top-level field', () => {
    const value = getDataByPath({ data, path: 'textLocalized' })
    expect(value).toEqual(data.textLocalized)

    const valueEn = getDataByPath({ data, path: 'textLocalized', locale: 'en' })
    expect(valueEn).toEqual(data.textLocalized.en)
  })

  it('gets field nested in array', () => {
    const row1Value = getDataByPath({ data, path: 'array.0.text' })
    expect(row1Value).toEqual(data.array[0].text)

    const row2Value = getDataByPath({ data, path: 'array.1.text' })
    expect(row2Value).toEqual(data.array[1].text)
  })

  it('gets group field deeply nested in group', () => {
    const value = getDataByPath({ data, path: 'array.1.group.text' })
    expect(value).toEqual(data.array[1].group.text)
  })

  it('gets text field deeply nested in tabs', () => {
    const row1Value = getDataByPath({ data, path: 'tabs.tab.array.0.text' })
    expect(row1Value).toEqual(data.tabs.tab.array[0].text)

    const row2Value = getDataByPath({ data, path: 'tabs.tab.array.1.text' })
    expect(row2Value).toEqual(data.tabs.tab.array[1].text)
  })
})
