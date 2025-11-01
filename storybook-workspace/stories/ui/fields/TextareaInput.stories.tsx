import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import React, { useState } from 'react'

import { FieldDescription } from '../../../packages/ui/src/fields/FieldDescription'
import { FieldError } from '../../../packages/ui/src/fields/FieldError'
import { FieldLabel } from '../../../packages/ui/src/fields/FieldLabel'
import { TextareaField, TextareaInput } from '../../../packages/ui/src/fields/Textarea'
import { PayloadMockProviders } from '../../_mocks/MockProviders'

const meta = {
  argTypes: {
    disabled: {
      control: 'boolean',
      description: 'Whether the field is disabled',
    },
    hasError: {
      control: 'boolean',
      description: 'Whether the field has validation errors',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text when empty',
    },
    readOnly: {
      control: 'boolean',
      description: 'Whether the field is read-only',
    },
    required: {
      control: 'boolean',
      description: 'Whether the field is required',
    },
    rows: {
      control: { type: 'range', max: 20, min: 2, step: 1 },
      description: 'Number of visible text lines',
    },
    value: {
      control: 'text',
      description: 'Current textarea value',
    },
  },
  component: TextareaInput,
  decorators: [
    (Story) => (
      <PayloadMockProviders>
        <div style={{ maxWidth: '700px', padding: '20px' }}>
          <Story />
        </div>
      </PayloadMockProviders>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Textarea components for multi-line text input - includes basic TextareaInput and complete TextareaField with label, description, and error handling.',
      },
    },
    layout: 'centered',
  },
  title: 'UI/Fields/Textarea Input',
} satisfies Meta<typeof TextareaInput>

export default meta
type Story = StoryObj<typeof meta>

// Basic TextareaInput stories
export const BasicTextareaInput: Story = {
  args: {
    disabled: false,
    hasError: false,
    placeholder: 'Enter your message here...',
    readOnly: false,
    required: false,
    rows: 4,
  },
  render: (args) => {
    const [value, setValue] = useState(args.value || '')

    return (
      <TextareaInput
        {...args}
        onChange={(e) => setValue(e.target.value)}
        path="example-textarea"
        value={value}
      />
    )
  },
}

export const TextareaVariants: Story = {
  render: () => {
    const [values, setValues] = useState({
      basic: '',
      disabled: '',
      error: 'This textarea has an error state',
      large: '',
      readOnly: 'This is a read-only textarea with some content that cannot be edited.',
      required: '',
    })

    const handleChange = (key: string) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setValues((prev) => ({ ...prev, [key]: e.target.value }))
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <h3>TextareaInput Variants</h3>

        <div>
          <h4>Basic Textarea</h4>
          <TextareaInput
            onChange={handleChange('basic')}
            path="basic-textarea"
            placeholder="Basic textarea input"
            rows={3}
            value={values.basic}
          />
        </div>

        <div>
          <h4>Required Textarea</h4>
          <TextareaInput
            onChange={handleChange('required')}
            path="required-textarea"
            placeholder="Required field (note the styling)"
            required={true}
            rows={3}
            value={values.required}
          />
        </div>

        <div>
          <h4>Read-Only Textarea</h4>
          <TextareaInput
            onChange={handleChange('readOnly')}
            path="readonly-textarea"
            readOnly={true}
            rows={3}
            value={values.readOnly}
          />
        </div>

        <div>
          <h4>Disabled Textarea</h4>
          <TextareaInput
            disabled={true}
            onChange={handleChange('disabled')}
            path="disabled-textarea"
            placeholder="Disabled textarea"
            rows={3}
            value={values.disabled}
          />
        </div>

        <div>
          <h4>Textarea with Error</h4>
          <TextareaInput
            hasError={true}
            onChange={handleChange('error')}
            path="error-textarea"
            placeholder="Textarea with error"
            rows={3}
            value={values.error}
          />
        </div>

        <div>
          <h4>Large Textarea (8 rows)</h4>
          <TextareaInput
            onChange={handleChange('large')}
            path="large-textarea"
            placeholder="Large textarea for longer content..."
            rows={8}
            value={values.large}
          />
        </div>
      </div>
    )
  },
}

export const TextareaSizes: Story = {
  render: () => {
    const [values, setValues] = useState({
      extraLarge: '',
      large: '',
      medium: '',
      small: '',
    })

    const handleChange = (key: string) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setValues((prev) => ({ ...prev, [key]: e.target.value }))
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h3>Textarea Sizes</h3>

        <div>
          <h4>Small (2 rows)</h4>
          <TextareaInput
            onChange={handleChange('small')}
            path="small-textarea"
            placeholder="Small textarea for brief comments"
            rows={2}
            value={values.small}
          />
        </div>

        <div>
          <h4>Medium (4 rows)</h4>
          <TextareaInput
            onChange={handleChange('medium')}
            path="medium-textarea"
            placeholder="Medium textarea for standard content"
            rows={4}
            value={values.medium}
          />
        </div>

        <div>
          <h4>Large (8 rows)</h4>
          <TextareaInput
            onChange={handleChange('large')}
            path="large-textarea"
            placeholder="Large textarea for detailed descriptions or longer content"
            rows={8}
            value={values.large}
          />
        </div>

        <div>
          <h4>Extra Large (12 rows)</h4>
          <TextareaInput
            onChange={handleChange('extraLarge')}
            path="xl-textarea"
            placeholder="Extra large textarea for extensive content like articles, documentation, or detailed descriptions"
            rows={12}
            value={values.extraLarge}
          />
        </div>
      </div>
    )
  },
}

export const TextareaWithCharacterCount: Story = {
  render: () => {
    const [value, setValue] = useState('')
    const maxLength = 500
    const remaining = maxLength - value.length
    const isOverLimit = remaining < 0

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h3>Textarea with Character Count</h3>

        <FieldLabel htmlFor="description-field" label="Product Description" required={true} />

        <TextareaInput
          hasError={isOverLimit}
          id="description-field"
          onChange={(e) => setValue(e.target.value)}
          path="description-field"
          placeholder={`Describe your product in detail (max ${maxLength} characters)...`}
          required={true}
          rows={6}
          value={value}
        />

        <div
          style={{
            alignItems: 'center',
            color: isOverLimit ? '#e53e3e' : '#666',
            display: 'flex',
            fontSize: '12px',
            justifyContent: 'space-between',
          }}
        >
          <FieldDescription description="Provide a detailed description of your product including features, benefits, and specifications." />
          <div
            style={{
              backgroundColor: isOverLimit ? '#fed7d7' : '#f7fafc',
              borderRadius: '4px',
              fontWeight: '500',
              padding: '4px 8px',
            }}
          >
            {value.length}/{maxLength} characters
          </div>
        </div>

        {isOverLimit && (
          <FieldError
            message={`Description exceeds maximum length by ${Math.abs(remaining)} characters`}
          />
        )}

        {value.length > 0 && !isOverLimit && (
          <div
            style={{
              backgroundColor: '#d4edda',
              border: '1px solid #c3e6cb',
              borderRadius: '4px',
              color: '#155724',
              fontSize: '14px',
              padding: '8px 12px',
            }}
          >
            ✓ {remaining} characters remaining
          </div>
        )}
      </div>
    )
  },
}

export const BlogPostEditor: Story = {
  render: () => {
    const [formData, setFormData] = useState({
      content: '',
      excerpt: '',
      metaDescription: '',
      tags: '',
      title: '',
    })

    const [errors, setErrors] = useState<Record<string, string>>({})

    const handleChange =
      (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData((prev) => ({ ...prev, [field]: e.target.value }))

        // Clear error when user starts typing
        if (errors[field]) {
          setErrors((prev) => ({ ...prev, [field]: '' }))
        }
      }

    const validate = () => {
      const newErrors: Record<string, string> = {}

      if (!formData.title.trim()) {
        newErrors.title = 'Title is required'
      }
      if (formData.title.length > 100) {
        newErrors.title = 'Title must be 100 characters or less'
      }

      if (!formData.excerpt.trim()) {
        newErrors.excerpt = 'Excerpt is required'
      }
      if (formData.excerpt.length > 300) {
        newErrors.excerpt = 'Excerpt must be 300 characters or less'
      }

      if (!formData.content.trim()) {
        newErrors.content = 'Content is required'
      }
      if (formData.content.length < 100) {
        newErrors.content = 'Content must be at least 100 characters'
      }

      if (formData.metaDescription.length > 160) {
        newErrors.metaDescription = 'Meta description should be 160 characters or less for SEO'
      }

      setErrors(newErrors)
      return Object.keys(newErrors).length === 0
    }

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      if (validate()) {
        console.log('Blog post data:', formData)
        alert('Blog post saved! Check console for data.')
      }
    }

    return (
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
      >
        <h3>Blog Post Editor</h3>

        {/* Title */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <FieldLabel htmlFor="title" label="Post Title" required={true} />
          <input
            id="title"
            onChange={handleChange('title')}
            placeholder="Enter blog post title"
            style={{
              border: errors.title ? '1px solid #e53e3e' : '1px solid #e2e8f0',
              borderRadius: '4px',
              fontSize: '16px',
              outline: 'none',
              padding: '8px 12px',
            }}
            type="text"
            value={formData.title}
          />
          <div style={{ color: '#666', fontSize: '12px' }}>
            {formData.title.length}/100 characters
          </div>
          {errors.title && <FieldError message={errors.title} />}
        </div>

        {/* Excerpt */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <FieldLabel htmlFor="excerpt" label="Excerpt" required={true} />
          <TextareaInput
            hasError={!!errors.excerpt}
            id="excerpt"
            onChange={handleChange('excerpt')}
            path="excerpt"
            placeholder="Write a compelling excerpt that summarizes your blog post..."
            required={true}
            rows={3}
            value={formData.excerpt}
          />
          <FieldDescription description="A brief summary that appears in search results and social media previews" />
          <div style={{ color: '#666', fontSize: '12px' }}>
            {formData.excerpt.length}/300 characters
          </div>
          {errors.excerpt && <FieldError message={errors.excerpt} />}
        </div>

        {/* Main Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <FieldLabel htmlFor="content" label="Content" required={true} />
          <TextareaInput
            hasError={!!errors.content}
            id="content"
            onChange={handleChange('content')}
            path="content"
            placeholder="Write your blog post content here... Share your thoughts, insights, and knowledge with your readers."
            required={true}
            rows={12}
            value={formData.content}
          />
          <FieldDescription description="The main content of your blog post. Supports Markdown formatting." />
          <div style={{ color: '#666', fontSize: '12px' }}>
            {formData.content.length} characters (minimum 100 required)
          </div>
          {errors.content && <FieldError message={errors.content} />}
        </div>

        {/* Tags */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <FieldLabel htmlFor="tags" label="Tags" />
          <TextareaInput
            id="tags"
            onChange={handleChange('tags')}
            path="tags"
            placeholder="Enter tags separated by commas (e.g., javascript, react, tutorial, web development)"
            rows={2}
            value={formData.tags}
          />
          <FieldDescription description="Help readers find your content with relevant tags" />
        </div>

        {/* Meta Description */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <FieldLabel htmlFor="meta-description" label="Meta Description (SEO)" />
          <TextareaInput
            hasError={!!errors.metaDescription}
            id="meta-description"
            onChange={handleChange('metaDescription')}
            path="meta-description"
            placeholder="Optional: Write a custom meta description for search engines..."
            rows={2}
            value={formData.metaDescription}
          />
          <FieldDescription description="Custom description for search engines (if different from excerpt)" />
          <div
            style={{
              color: formData.metaDescription.length > 160 ? '#e53e3e' : '#666',
              fontSize: '12px',
            }}
          >
            {formData.metaDescription.length}/160 characters (recommended)
          </div>
          {errors.metaDescription && <FieldError message={errors.metaDescription} />}
        </div>

        {/* Submit Button */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          <button
            style={{
              backgroundColor: '#007acc',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              padding: '12px 24px',
            }}
            type="submit"
          >
            Publish Post
          </button>

          <button
            onClick={() => {
              console.log('Draft saved:', formData)
              alert('Draft saved!')
            }}
            style={{
              backgroundColor: '#f7fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '4px',
              color: '#4a5568',
              cursor: 'pointer',
              fontSize: '16px',
              padding: '12px 24px',
            }}
            type="button"
          >
            Save Draft
          </button>
        </div>

        {/* Preview */}
        {formData.content && (
          <div
            style={{
              backgroundColor: '#f8f9fa',
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              marginTop: '24px',
              padding: '20px',
            }}
          >
            <h4 style={{ color: '#495057', marginBottom: '16px' }}>Preview</h4>
            <div
              style={{
                color: '#212529',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
              }}
            >
              <h2 style={{ marginBottom: '12px' }}>{formData.title || 'Untitled Post'}</h2>
              {formData.excerpt && (
                <p
                  style={{
                    color: '#6c757d',
                    fontStyle: 'italic',
                    marginBottom: '16px',
                  }}
                >
                  {formData.excerpt}
                </p>
              )}
              <div>{formData.content}</div>
            </div>
          </div>
        )}
      </form>
    )
  },
}
