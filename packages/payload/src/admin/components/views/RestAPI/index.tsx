import JsonFormatter from 'json-formatter-js'
import * as React from 'react'
import { useTranslation } from 'react-i18next'

import { requests } from '../../../api'
import { Gutter } from '../../elements/Gutter'
import TextInput from '../../forms/field-types/Text/Input'
import { useConfig } from '../../utilities/Config'
import { useDocumentInfo } from '../../utilities/DocumentInfo'
import './index.scss'

const baseClass = 'query-inspector'

export const QueryInspector = () => {
  const { id, collection } = useDocumentInfo()
  const { serverURL } = useConfig()
  const { i18n } = useTranslation()

  const [query, setQuery] = React.useState<string>('')
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const fetchData = async () => {
      if (id) {
        const request = await requests.get(
          `${serverURL}/api/${collection.slug}/${id}${query ? `${query}` : ''}`,
          {
            headers: {
              'Accept-Language': i18n.language,
            },
          },
        )

        const json = await request.json()
        const formatter = new JsonFormatter(json, Infinity)
        const formattedJSON = formatter.render()

        containerRef.current.innerHTML = '' // Clear previous content
        containerRef.current.appendChild(formattedJSON)
      }
    }

    fetchData()
  }, [id, collection, serverURL, i18n.language, query])

  return (
    <Gutter className={baseClass} right={false}>
      <div className={`${baseClass}__configuration`}>
        <h3 className={`${baseClass}__configuration-title`}>Query Builder</h3>
        <TextInput
          name="query"
          onChange={(e) => setQuery(e.target.value)}
          path="query"
          placeholder="?depth=1"
          value={query}
        />
      </div>

      <div className={`${baseClass}__results-container`} ref={containerRef} />
    </Gutter>
  )
}
