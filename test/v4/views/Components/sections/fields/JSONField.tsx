'use client'

import { CodeEditor } from '@payloadcms/ui'
import React from 'react'

import { Section, Variant } from '../../shared.js'

export const JSONFieldSection: React.FC = () => (
  <Section id="json-field" selectedComponent="json-field" title="JSON Field">
    <Variant label="Object">
      <div style={{ height: '150px', width: '100%' }}>
        <CodeEditor
          defaultLanguage="json"
          onChange={() => {}}
          readOnly={false}
          value={`{\n  "key": "value",\n  "nested": {\n    "items": [1, 2, 3]\n  }\n}`}
        />
      </div>
    </Variant>
    <Variant label="Array">
      <div style={{ height: '120px', width: '100%' }}>
        <CodeEditor
          defaultLanguage="json"
          onChange={() => {}}
          readOnly={false}
          value={`[\n  { "id": 1, "name": "Item 1" },\n  { "id": 2, "name": "Item 2" }\n]`}
        />
      </div>
    </Variant>
  </Section>
)
