import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import React from 'react'

import { CodeEditor } from '../../../packages/ui/src/elements/CodeEditor'
import { FieldDescription } from '../../../packages/ui/src/fields/FieldDescription'
import { FieldError } from '../../../packages/ui/src/fields/FieldError'
import { FieldLabel } from '../../../packages/ui/src/fields/FieldLabel'
import { fieldBaseClass } from '../../../packages/ui/src/fields/shared'
import { PayloadMockProviders } from '../../_mocks/MockProviders'

// Mock Code Field component that simulates the real CodeField behavior
interface CodeFieldProps {
  admin?: {
    description?: string
    disabled?: boolean
    language?: string
  }
  label: string
  name: string
  onChange?: (value: string) => void
  path: string
  required?: boolean
  value?: string
}

const CodeField: React.FC<CodeFieldProps> = ({
  name,
  admin = {},
  label,
  onChange,
  required,
  value = '',
}) => {
  const { description, disabled, language = 'javascript' } = admin
  const [codeValue, setCodeValue] = React.useState(value)

  const handleChange = (newValue: string) => {
    setCodeValue(newValue)
    if (onChange) {
      onChange(newValue)
    }
  }

  return (
    <div
      className={[
        fieldBaseClass,
        'code-field',
        required && !codeValue && 'error',
        disabled && 'read-only',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <FieldLabel label={label} required={required} />
      <div className={`${fieldBaseClass}__wrap`}>
        {required && !codeValue && <FieldError message="This field is required" />}
        <CodeEditor
          defaultLanguage={language}
          onChange={handleChange}
          readOnly={disabled}
          value={codeValue}
          wrapperProps={{
            id: `field-${name.replace(/\./g, '__')}`,
          }}
        />
      </div>
      {description && <FieldDescription description={description} />}
    </div>
  )
}

const meta = {
  argTypes: {
    name: {
      control: 'text',
      description: 'The name of the field',
    },
    admin: {
      control: 'object',
      description: 'Admin configuration',
    },
    label: {
      control: 'text',
      description: 'Label for the code field',
    },
    language: {
      control: 'select',
      description: 'Programming language for syntax highlighting',
      options: ['javascript', 'typescript', 'json', 'html', 'css', 'python', 'sql'],
    },
    required: {
      control: 'boolean',
      description: 'Whether the field is required',
    },
  },
  component: CodeField,
  decorators: [
    (Story) => (
      <PayloadMockProviders>
        <div style={{ maxWidth: '1200px', padding: '20px', width: '100%' }}>
          <Story />
        </div>
      </PayloadMockProviders>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'CodeField provides syntax-highlighted code editing capabilities with language detection and validation.',
      },
    },
    layout: 'centered',
  },
  title: 'UI/Fields/CodeField',
} satisfies Meta<typeof CodeField>

export default meta
type Story = StoryObj<typeof meta>

export const JavaScript: Story = {
  args: {
    name: 'jsCode',
    admin: {
      language: 'javascript',
    },
    label: 'JavaScript Code',
    path: 'jsCode',
    required: false,
  },
}

export const TypeScript: Story = {
  args: {
    name: 'tsCode',
    admin: {
      language: 'typescript',
    },
    label: 'TypeScript Code',
    path: 'tsCode',
    required: false,
  },
}

export const JSON: Story = {
  args: {
    name: 'jsonData',
    admin: {
      language: 'json',
    },
    label: 'JSON Configuration',
    path: 'jsonData',
    required: false,
  },
}

export const HTML: Story = {
  args: {
    name: 'htmlContent',
    admin: {
      language: 'html',
    },
    label: 'HTML Template',
    path: 'htmlContent',
    required: false,
  },
}

export const CSS: Story = {
  args: {
    name: 'cssStyles',
    admin: {
      language: 'css',
    },
    label: 'CSS Styles',
    path: 'cssStyles',
    required: false,
  },
}

export const Required: Story = {
  args: {
    name: 'requiredCode',
    admin: {
      language: 'javascript',
    },
    label: 'Required Code Field',
    path: 'requiredCode',
    required: true,
  },
}

export const WithDescription: Story = {
  args: {
    name: 'describedCode',
    admin: {
      description: 'Enter your API endpoint configuration code here. Supports JavaScript syntax.',
      language: 'javascript',
    },
    label: 'API Configuration',
    path: 'describedCode',
    required: false,
  },
}

export const Interactive: Story = {
  render: () => {
    const [language, setLanguage] = React.useState('javascript')
    const [code, setCode] = React.useState('')

    const sampleCode = {
      css: `/* Payload CMS Theme Styles */
:root {
  --payload-primary: #007acc;
  --payload-secondary: #6c757d;
  --payload-success: #28a745;
  --payload-warning: #ffc107;
  --payload-danger: #dc3545;
}

.payload-button {
  background: var(--payload-primary);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.payload-button:hover {
  background: var(--theme-input-bg-hover);
}`,
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payload CMS Page</title>
</head>
<body>
  <header>
    <h1>Welcome to Payload CMS</h1>
  </header>
  <main>
    <p>Build amazing applications with Payload.</p>
  </main>
</body>
</html>`,
      javascript: `// Sample JavaScript function
function greetUser(name) {
  return \`Hello, \${name}! Welcome to Payload CMS.\`;
}

const user = { name: 'Developer' };
console.log(greetUser(user.name));`,
      json: `{
  "name": "payload-project",
  "version": "1.0.0",
  "description": "A Payload CMS project",
  "dependencies": {
    "payload": "^3.0.0",
    "next": "^14.0.0",
    "react": "^18.0.0"
  },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}`,
      typescript: `// Sample TypeScript interface
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

const createUser = (userData: Partial<User>): User => {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date(),
    ...userData,
  } as User;
};`,
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h3>Interactive Code Field</h3>
          <p>
            Switch between different programming languages to see syntax highlighting in action.
          </p>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>
              Language:
            </label>
            <select
              onChange={(e) => setLanguage(e.target.value)}
              style={{
                border: '1px solid var(--theme-elevation-150)',
                borderRadius: '4px',
                fontSize: '14px',
                minWidth: '150px',
                padding: '8px 12px',
              }}
              value={language}
            >
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="json">JSON</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <button
              onClick={() => setCode(sampleCode[language])}
              style={{
                backgroundColor: 'var(--theme-input-bg)',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                cursor: 'pointer',
                padding: '8px 16px',
              }}
              type="button"
            >
              Load Sample {language.charAt(0).toUpperCase() + language.slice(1)} Code
            </button>
          </div>

          <CodeField
            admin={{
              description: `Currently editing ${language.toUpperCase()} code. Use the button above to load sample code.`,
              language,
            }}
            label={`${language.charAt(0).toUpperCase() + language.slice(1)} Code Editor`}
            name="interactiveCode"
            path="interactiveCode"
            value={code}
          />
        </div>
      </div>
    )
  },
}

export const AllLanguages: Story = {
  render: () => {
    const languages = [
      { key: 'javascript', label: 'JavaScript', sample: 'const greeting = "Hello, World!";' },
      {
        key: 'typescript',
        label: 'TypeScript',
        sample: 'const greeting: string = "Hello, World!";',
      },
      { key: 'json', label: 'JSON', sample: '{ "message": "Hello, World!" }' },
      { key: 'html', label: 'HTML', sample: '<h1>Hello, World!</h1>' },
      { key: 'css', label: 'CSS', sample: 'h1 { color: #007acc; }' },
    ]

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <h3>Code Field Language Support</h3>
        <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: '1fr 1fr' }}>
          {languages.map(({ key, label, sample }) => (
            <div key={key}>
              <CodeField
                admin={{
                  language: key,
                }}
                label={`${label} Example`}
                name={`${key}Code`}
                path={`${key}Code`}
                value={sample}
              />
            </div>
          ))}
        </div>
      </div>
    )
  },
}

export const ValidationStates: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h3>Code Field Validation States</h3>

      <div>
        <h4>Valid State</h4>
        <CodeField
          admin={{
            language: 'javascript',
          }}
          label="Valid JavaScript Code"
          name="validCode"
          path="validCode"
          value='console.log("This is valid JavaScript");'
        />
      </div>

      <div>
        <h4>Required Field (Empty)</h4>
        <CodeField
          admin={{
            language: 'json',
          }}
          label="Required JSON Configuration"
          name="requiredJson"
          path="requiredJson"
          required={true}
          value=""
        />
      </div>

      <div>
        <h4>With Custom Validation Message</h4>
        <CodeField
          admin={{
            description: 'Enter valid CSS rules for the component styling.',
            language: 'css',
          }}
          label="Component Styles"
          name="componentStyles"
          path="componentStyles"
          required={true}
          value=".invalid-css { color: ; }"
        />
      </div>
    </div>
  ),
}
