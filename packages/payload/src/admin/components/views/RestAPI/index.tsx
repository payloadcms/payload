import JsonFormatter from 'json-formatter-js'
import * as React from 'react'
import { useTranslation } from 'react-i18next'

import { requests } from '../../../api'
import { Gutter } from '../../elements/Gutter'
import { useConfig } from '../../utilities/Config'
import { useDocumentInfo } from '../../utilities/DocumentInfo'
import './index.scss'

const testNestedObjects = {
  a: 1,
  b: {
    c: 2,
    d: {
      e: 3,
      f: {
        array: [1, 2, 3],
        g: 4,
        h: {
          i: 5,
        },
        string:
          'then push so I dont have to hear nate whine about it then push so I dont have to hear nate whine about it then push so I dont have to hear nate whine about it then push so I dont have to hear nate whine about it',
      },
    },
  },
}

const baseClass = 'query-inspector'

export const QueryInspector = () => {
  const { id, collection } = useDocumentInfo()
  const { serverURL } = useConfig()
  const { i18n } = useTranslation()

  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const fetchData = async () => {
      if (id) {
        const request = await requests.get(`${serverURL}/api/${collection.slug}/${id}`, {
          headers: {
            'Accept-Language': i18n.language,
          },
        })

        const json = await request.json()
        const formatter = new JsonFormatter(testNestedObjects, Infinity)
        const formattedJSON = formatter.render()

        containerRef.current.innerHTML = '' // Clear previous content
        containerRef.current.appendChild(formattedJSON)
      }
    }

    fetchData()
  }, [id, collection, serverURL, i18n.language])

  return (
    <Gutter className={baseClass} right={false}>
      <div>Editable section</div>

      <div className={`${baseClass}__results-container`} ref={containerRef} />
    </Gutter>
  )
}
