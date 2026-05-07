'use client'

import { CodeEditor } from '@payloadcms/ui'
import React from 'react'

import { Section, Variant } from '../../shared.js'

export const CodeFieldSection: React.FC = () => (
  <Section id="code-field" selectedComponent="code-field" title="Code Field">
    <Variant label="JavaScript">
      <div style={{ height: '150px', width: '100%' }}>
        <CodeEditor
          defaultLanguage="javascript"
          onChange={() => {}}
          readOnly={false}
          value={`function hello() {\n  console.log('Hello, world!');\n}`}
        />
      </div>
    </Variant>
    <Variant label="JSON">
      <div style={{ height: '150px', width: '100%' }}>
        <CodeEditor
          defaultLanguage="json"
          onChange={() => {}}
          readOnly={false}
          value={`{\n  "name": "example",\n  "value": 42\n}`}
        />
      </div>
    </Variant>
  </Section>
)
