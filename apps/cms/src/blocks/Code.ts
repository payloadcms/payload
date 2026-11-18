import { CodeBlock } from '@payloadcms/richtext-lexical'

/**
 * Code blocks in rich text. Keys are Monaco language IDs (highlighting while editing); the website
 * highlights them with Prism on the published page.
 */
export const Code = CodeBlock({
  defaultLanguage: 'typescript',
  languages: {
    cpp: 'C++',
    css: 'CSS',
    dockerfile: 'Dockerfile',
    go: 'Go',
    graphql: 'GraphQL',
    html: 'HTML',
    java: 'Java',
    javascript: 'JavaScript',
    json: 'JSON',
    kotlin: 'Kotlin',
    markdown: 'Markdown',
    'objective-c': 'Objective-C',
    php: 'PHP',
    plaintext: 'Plain Text',
    python: 'Python',
    ruby: 'Ruby',
    rust: 'Rust',
    scss: 'SCSS',
    shell: 'Shell',
    solidity: 'Solidity',
    sql: 'SQL',
    swift: 'Swift',
    typescript: 'TypeScript',
    xml: 'XML',
    yaml: 'YAML',
  },
})
