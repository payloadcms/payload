#!/usr/bin/env node

/**
 * Script to automatically generate Storybook stories for all Payload UI components
 */

const fs = require('fs')
const path = require('path')

const PACKAGES_DIR = path.join(__dirname, '../packages/ui/src')
const STORIES_DIR = path.join(__dirname, '../stories')

// Template for basic component story
const createStoryTemplate = (componentPath, componentName, category, title) => {
  return `import type { Meta, StoryObj } from '@storybook/react'
import { ${componentName} } from '../../../${componentPath}'

const meta = {
  title: '${category}/${title}',
  component: ${componentName},
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '${componentName} component from Payload CMS.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ${componentName}>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}
`
}

// Generate stories for icons
const generateIconStories = () => {
  const iconsDir = path.join(PACKAGES_DIR, 'icons')
  const iconDirs = fs.readdirSync(iconsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)

  console.log(`Found ${iconDirs.length} icon components`)

  iconDirs.forEach(iconName => {
    const iconPath = path.join(iconsDir, iconName, 'index.tsx')
    if (fs.existsSync(iconPath)) {
      const componentName = `${iconName}Icon`
      const story = createStoryTemplate(
        `packages/ui/src/icons/${iconName}`,
        componentName,
        'UI/Icons',
        iconName
      )
      
      const storyPath = path.join(STORIES_DIR, 'ui/icons', `${iconName}.stories.tsx`)
      
      // Only create if it doesn't exist
      if (!fs.existsSync(storyPath)) {
        fs.writeFileSync(storyPath, story)
        console.log(`Generated story for ${componentName}`)
      } else {
        console.log(`Story already exists for ${componentName}`)
      }
    }
  })
}

// Generate stories for elements
const generateElementStories = () => {
  const elementsDir = path.join(PACKAGES_DIR, 'elements')
  const elementDirs = fs.readdirSync(elementsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)

  console.log(`Found ${elementDirs.length} element components`)

  elementDirs.slice(0, 20).forEach(elementName => { // Limit to first 20 for now
    const elementPath = path.join(elementsDir, elementName, 'index.tsx')
    if (fs.existsSync(elementPath)) {
      const componentName = elementName
      const story = createStoryTemplate(
        `packages/ui/src/elements/${elementName}`,
        componentName,
        'UI/Elements',
        elementName
      )
      
      const storyPath = path.join(STORIES_DIR, 'ui/elements', `${elementName}.stories.tsx`)
      
      // Only create if it doesn't exist
      if (!fs.existsSync(storyPath)) {
        fs.writeFileSync(storyPath, story)
        console.log(`Generated story for ${componentName}`)
      } else {
        console.log(`Story already exists for ${componentName}`)
      }
    }
  })
}

// Generate stories for fields
const generateFieldStories = () => {
  const fieldsDir = path.join(PACKAGES_DIR, 'fields')
  const fieldDirs = fs.readdirSync(fieldsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)

  console.log(`Found ${fieldDirs.length} field components`)

  fieldDirs.forEach(fieldName => {
    if (fieldName === 'shared') return // Skip shared directory
    
    const fieldPath = path.join(fieldsDir, fieldName, 'index.tsx')
    if (fs.existsSync(fieldPath)) {
      const componentName = `${fieldName}Field`
      const story = createStoryTemplate(
        `packages/ui/src/fields/${fieldName}`,
        componentName,
        'UI/Fields',
        fieldName
      )
      
      const storyPath = path.join(STORIES_DIR, 'ui/fields', `${fieldName}.stories.tsx`)
      
      // Only create if it doesn't exist
      if (!fs.existsSync(storyPath)) {
        fs.writeFileSync(storyPath, story)
        console.log(`Generated story for ${componentName}`)
      } else {
        console.log(`Story already exists for ${componentName}`)
      }
    }
  })
}

// Main execution
console.log('Generating Storybook stories for Payload UI components...')

// Create directories if they don't exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

ensureDir(path.join(STORIES_DIR, 'ui/icons'))
ensureDir(path.join(STORIES_DIR, 'ui/elements'))
ensureDir(path.join(STORIES_DIR, 'ui/fields'))

generateIconStories()
generateElementStories()
generateFieldStories()

console.log('Story generation complete!')