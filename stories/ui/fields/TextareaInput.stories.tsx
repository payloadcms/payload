import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import React, { useState } from 'react'
import { TextareaInput, TextareaField } from '../../../packages/ui/src/fields/Textarea'
import { FieldLabel } from '../../../packages/ui/src/fields/FieldLabel'
import { FieldError } from '../../../packages/ui/src/fields/FieldError'
import { FieldDescription } from '../../../packages/ui/src/fields/FieldDescription'
import { PayloadMockProviders } from '../../_mocks/MockProviders'

const meta = {
  title: 'UI/Fields/Textarea Input',
  component: TextareaInput,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Textarea components for multi-line text input - includes basic TextareaInput and complete TextareaField with label, description, and error handling.',
      },
    },
  },
  decorators: [
    (Story) => (
      <PayloadMockProviders>
        <div style={{ maxWidth: '700px', padding: '20px' }}>
          <Story />
        </div>
      </PayloadMockProviders>
    ),
  ],
  argTypes: {
    value: {
      control: 'text',
      description: 'Current textarea value',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text when empty',
    },
    required: {
      control: 'boolean',
      description: 'Whether the field is required',
    },
    readOnly: {
      control: 'boolean',
      description: 'Whether the field is read-only',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the field is disabled',
    },
    hasError: {
      control: 'boolean',
      description: 'Whether the field has validation errors',
    },
    rows: {
      control: { type: 'range', min: 2, max: 20, step: 1 },
      description: 'Number of visible text lines',
    },
  },
} satisfies Meta<typeof TextareaInput>

export default meta
type Story = StoryObj<typeof meta>

// Basic TextareaInput stories
export const BasicTextareaInput: Story = {
  render: (args) => {
    const [value, setValue] = useState(args.value || '')
    
    return (
      <TextareaInput
        {...args}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        path="example-textarea"
      />
    )
  },
  args: {
    placeholder: 'Enter your message here...',
    rows: 4,
    required: false,
    readOnly: false,
    disabled: false,
    hasError: false,
  },
}

export const TextareaVariants: Story = {
  render: () => {
    const [values, setValues] = useState({
      basic: '',
      required: '',
      readOnly: 'This is a read-only textarea with some content that cannot be edited.',
      disabled: '',
      error: 'This textarea has an error state',
      large: '',
    })
    
    const handleChange = (key: string) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setValues(prev => ({ ...prev, [key]: e.target.value }))
    }
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <h3>TextareaInput Variants</h3>
        
        <div>
          <h4>Basic Textarea</h4>
          <TextareaInput
            value={values.basic}
            onChange={handleChange('basic')}
            placeholder="Basic textarea input"
            rows={3}
            path="basic-textarea"
          />
        </div>
        
        <div>
          <h4>Required Textarea</h4>
          <TextareaInput
            value={values.required}
            onChange={handleChange('required')}
            placeholder="Required field (note the styling)"
            required={true}
            rows={3}
            path="required-textarea"
          />
        </div>
        
        <div>
          <h4>Read-Only Textarea</h4>
          <TextareaInput
            value={values.readOnly}
            onChange={handleChange('readOnly')}
            readOnly={true}
            rows={3}
            path="readonly-textarea"
          />
        </div>
        
        <div>
          <h4>Disabled Textarea</h4>
          <TextareaInput
            value={values.disabled}
            onChange={handleChange('disabled')}
            placeholder="Disabled textarea"
            disabled={true}
            rows={3}
            path="disabled-textarea"
          />
        </div>
        
        <div>
          <h4>Textarea with Error</h4>
          <TextareaInput
            value={values.error}
            onChange={handleChange('error')}
            placeholder="Textarea with error"
            hasError={true}
            rows={3}
            path="error-textarea"
          />
        </div>
        
        <div>
          <h4>Large Textarea (8 rows)</h4>
          <TextareaInput
            value={values.large}
            onChange={handleChange('large')}
            placeholder="Large textarea for longer content..."
            rows={8}
            path="large-textarea"
          />
        </div>
      </div>
    )
  },
}

export const TextareaSizes: Story = {
  render: () => {
    const [values, setValues] = useState({
      small: '',
      medium: '',
      large: '',
      extraLarge: '',
    })
    
    const handleChange = (key: string) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setValues(prev => ({ ...prev, [key]: e.target.value }))
    }
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h3>Textarea Sizes</h3>
        
        <div>
          <h4>Small (2 rows)</h4>
          <TextareaInput
            value={values.small}
            onChange={handleChange('small')}
            placeholder="Small textarea for brief comments"
            rows={2}
            path="small-textarea"
          />
        </div>
        
        <div>
          <h4>Medium (4 rows)</h4>
          <TextareaInput
            value={values.medium}
            onChange={handleChange('medium')}
            placeholder="Medium textarea for standard content"
            rows={4}
            path="medium-textarea"
          />
        </div>
        
        <div>
          <h4>Large (8 rows)</h4>
          <TextareaInput
            value={values.large}
            onChange={handleChange('large')}
            placeholder="Large textarea for detailed descriptions or longer content"
            rows={8}
            path="large-textarea"
          />
        </div>
        
        <div>
          <h4>Extra Large (12 rows)</h4>
          <TextareaInput
            value={values.extraLarge}
            onChange={handleChange('extraLarge')}
            placeholder="Extra large textarea for extensive content like articles, documentation, or detailed descriptions"
            rows={12}
            path="xl-textarea"
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
        
        <FieldLabel 
          label="Product Description" 
          required={true}
          htmlFor="description-field"
        />
        
        <TextareaInput
          id="description-field"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={`Describe your product in detail (max ${maxLength} characters)...`}
          rows={6}
          hasError={isOverLimit}
          required={true}
          path="description-field"
        />
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          color: isOverLimit ? '#e53e3e' : '#666'
        }}>
          <FieldDescription description="Provide a detailed description of your product including features, benefits, and specifications." />
          <div style={{ 
            padding: '4px 8px',
            backgroundColor: isOverLimit ? '#fed7d7' : '#f7fafc',
            borderRadius: '4px',
            fontWeight: '500'
          }}>
            {value.length}/{maxLength} characters
          </div>
        </div>
        
        {isOverLimit && (
          <FieldError message={`Description exceeds maximum length by ${Math.abs(remaining)} characters`} />
        )}
        
        {value.length > 0 && !isOverLimit && (
          <div style={{ 
            padding: '8px 12px', 
            backgroundColor: '#d4edda', 
            border: '1px solid #c3e6cb',
            borderRadius: '4px',
            color: '#155724',
            fontSize: '14px'
          }}>
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
      title: '',
      excerpt: '',
      content: '',
      tags: '',
      metaDescription: '',
    })
    
    const [errors, setErrors] = useState<Record<string, string>>({})
    
    const handleChange = (field: string) => (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      setFormData(prev => ({ ...prev, [field]: e.target.value }))
      
      // Clear error when user starts typing
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: '' }))
      }
    }
    
    const validate = () => {
      const newErrors: Record<string, string> = {}
      
      if (!formData.title.trim()) newErrors.title = 'Title is required'
      if (formData.title.length > 100) newErrors.title = 'Title must be 100 characters or less'
      
      if (!formData.excerpt.trim()) newErrors.excerpt = 'Excerpt is required'
      if (formData.excerpt.length > 300) newErrors.excerpt = 'Excerpt must be 300 characters or less'
      
      if (!formData.content.trim()) newErrors.content = 'Content is required'
      if (formData.content.length < 100) newErrors.content = 'Content must be at least 100 characters'
      
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
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <h3>Blog Post Editor</h3>
        
        {/* Title */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <FieldLabel label="Post Title" required={true} htmlFor="title" />
          <input
            id="title"
            type="text"
            value={formData.title}
            onChange={handleChange('title')}
            placeholder="Enter blog post title"
            style={{
              padding: '8px 12px',
              border: errors.title ? '1px solid #e53e3e' : '1px solid #e2e8f0',
              borderRadius: '4px',
              fontSize: '16px',
              outline: 'none',
            }}
          />
          <div style={{ fontSize: '12px', color: '#666' }}>
            {formData.title.length}/100 characters
          </div>
          {errors.title && <FieldError message={errors.title} />}
        </div>
        
        {/* Excerpt */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <FieldLabel label="Excerpt" required={true} htmlFor="excerpt" />
          <TextareaInput
            id="excerpt"
            value={formData.excerpt}
            onChange={handleChange('excerpt')}
            placeholder="Write a compelling excerpt that summarizes your blog post..."
            rows={3}
            hasError={!!errors.excerpt}
            required={true}
            path="excerpt"
          />
          <FieldDescription description="A brief summary that appears in search results and social media previews" />
          <div style={{ fontSize: '12px', color: '#666' }}>
            {formData.excerpt.length}/300 characters
          </div>
          {errors.excerpt && <FieldError message={errors.excerpt} />}
        </div>
        
        {/* Main Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <FieldLabel label="Content" required={true} htmlFor="content" />
          <TextareaInput
            id="content"
            value={formData.content}
            onChange={handleChange('content')}
            placeholder="Write your blog post content here... Share your thoughts, insights, and knowledge with your readers."
            rows={12}
            hasError={!!errors.content}
            required={true}
            path="content"
          />
          <FieldDescription description="The main content of your blog post. Supports Markdown formatting." />
          <div style={{ fontSize: '12px', color: '#666' }}>
            {formData.content.length} characters (minimum 100 required)
          </div>
          {errors.content && <FieldError message={errors.content} />}
        </div>
        
        {/* Tags */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <FieldLabel label="Tags" htmlFor="tags" />
          <TextareaInput
            id="tags"
            value={formData.tags}
            onChange={handleChange('tags')}
            placeholder="Enter tags separated by commas (e.g., javascript, react, tutorial, web development)"
            rows={2}
            path="tags"
          />
          <FieldDescription description="Help readers find your content with relevant tags" />
        </div>
        
        {/* Meta Description */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <FieldLabel label="Meta Description (SEO)" htmlFor="meta-description" />
          <TextareaInput
            id="meta-description"
            value={formData.metaDescription}
            onChange={handleChange('metaDescription')}
            placeholder="Optional: Write a custom meta description for search engines..."
            rows={2}
            hasError={!!errors.metaDescription}
            path="meta-description"
          />
          <FieldDescription description="Custom description for search engines (if different from excerpt)" />
          <div style={{ fontSize: '12px', color: formData.metaDescription.length > 160 ? '#e53e3e' : '#666' }}>
            {formData.metaDescription.length}/160 characters (recommended)
          </div>
          {errors.metaDescription && <FieldError message={errors.metaDescription} />}
        </div>
        
        {/* Submit Button */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          <button
            type="submit"
            style={{
              padding: '12px 24px',
              backgroundColor: '#007acc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            Publish Post
          </button>
          
          <button
            type="button"
            onClick={() => {
              console.log('Draft saved:', formData)
              alert('Draft saved!')
            }}
            style={{
              padding: '12px 24px',
              backgroundColor: '#f7fafc',
              color: '#4a5568',
              border: '1px solid #e2e8f0',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: 'pointer',
            }}
          >
            Save Draft
          </button>
        </div>
        
        {/* Preview */}
        {formData.content && (
          <div style={{ 
            marginTop: '24px',
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e9ecef'
          }}>
            <h4 style={{ marginBottom: '16px', color: '#495057' }}>Preview</h4>
            <div style={{ 
              whiteSpace: 'pre-wrap',
              lineHeight: '1.6',
              color: '#212529'
            }}>
              <h2 style={{ marginBottom: '12px' }}>{formData.title || 'Untitled Post'}</h2>
              {formData.excerpt && (
                <p style={{ 
                  fontStyle: 'italic', 
                  marginBottom: '16px',
                  color: '#6c757d'
                }}>
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