import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import React from 'react'

import { FieldDescription } from '../../../packages/ui/src/fields/FieldDescription'
import { FieldError } from '../../../packages/ui/src/fields/FieldError'
import { FieldLabel } from '../../../packages/ui/src/fields/FieldLabel'
import { fieldBaseClass } from '../../../packages/ui/src/fields/shared'
import { PayloadMockProviders } from '../../_mocks/MockProviders'

// Import the actual Payload Slug field styles
import '../../../packages/ui/src/fields/Slug/index.scss'

interface SlugFieldProps {
  admin?: {
    checkAvailability?: boolean
    description?: string
    disabled?: boolean
    useAsTitle?: string
  }
  label: string
  name: string
  onChange?: (value: string) => void
  path: string
  required?: boolean
  value?: string
}

const SlugField: React.FC<SlugFieldProps> = ({
  name,
  admin = {},
  label,
  onChange,
  required,
  value = '',
}) => {
  const { checkAvailability, description, disabled } = admin
  const [slugValue, setSlugValue] = React.useState(value)

  const handleChange = (newValue: string) => {
    // Simple slug formatting
    const slug = newValue
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')

    setSlugValue(slug)
    if (onChange) {
      onChange(slug)
    }
  }

  return (
    <div
      className={[
        fieldBaseClass,
        'field-type',
        'slug',
        required && !slugValue && 'error',
        disabled && 'read-only',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <FieldLabel label={label} required={required} />
      {description && <FieldDescription description={description} />}
      <div className={`${fieldBaseClass}__wrap`}>
        <input
          disabled={disabled}
          name={name}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="url-friendly-slug"
          style={{ fontFamily: 'Monaco, Menlo, monospace' }}
          type="text"
          value={slugValue}
        />
        {checkAvailability && (
          <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px' }}>
            ✓ Availability checking enabled
          </div>
        )}
      </div>
      {required && !slugValue && <FieldError message="Slug is required" />}
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
      description: 'Admin configuration including useAsTitle field reference',
    },
    label: {
      control: 'text',
      description: 'Label for the slug field',
    },
    required: {
      control: 'boolean',
      description: 'Whether the field is required',
    },
  },
  component: SlugField,
  decorators: [
    (Story) => (
      <PayloadMockProviders>
        <div style={{ maxWidth: '600px', padding: '20px', width: '100%' }}>
          <Story />
        </div>
      </PayloadMockProviders>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'SlugField provides URL-friendly slug generation from other fields, with auto-generation and manual editing capabilities.',
      },
    },
    layout: 'centered',
  },
  title: 'UI/Fields/SlugField',
} satisfies Meta<typeof SlugField>

export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = {
  args: {
    name: 'slug',
    admin: {
      useAsTitle: 'title',
    },
    label: 'URL Slug',
    path: 'slug',
    required: false,
  },
}

export const Required: Story = {
  args: {
    name: 'requiredSlug',
    admin: {
      useAsTitle: 'title',
    },
    label: 'Required Slug',
    path: 'requiredSlug',
    required: true,
  },
}

export const WithDescription: Story = {
  args: {
    name: 'postSlug',
    admin: {
      description:
        'This will be used in the URL for this post. Leave blank to auto-generate from the title.',
      useAsTitle: 'title',
    },
    label: 'Post URL Slug',
    path: 'postSlug',
    required: false,
  },
}

export const CustomCheckAvailability: Story = {
  args: {
    name: 'customSlug',
    admin: {
      checkAvailability: true,
      description: 'Availability checking is enabled for this slug field.',
      useAsTitle: 'name',
    },
    label: 'Custom Slug',
    path: 'customSlug',
    required: false,
  },
}

export const Interactive: Story = {
  render: () => {
    const [title, setTitle] = React.useState('')
    const [slug, setSlug] = React.useState('')

    // Simple slug generation function
    const generateSlug = (text: string) => {
      return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove non-word characters except spaces and hyphens
        .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, and multiple hyphens with single hyphen
        .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    }

    const handleTitleChange = (newTitle: string) => {
      setTitle(newTitle)
      // Auto-generate slug if slug field is empty or matches the previous auto-generated slug
      const autoSlug = generateSlug(newTitle)
      if (!slug || slug === generateSlug(title)) {
        setSlug(autoSlug)
      }
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h3>Interactive Slug Generation</h3>
          <p>
            Type in the title field to see automatic slug generation. You can also manually edit the
            slug.
          </p>
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>
            Article Title:
          </label>
          <input
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Enter article title..."
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: '4px',
              fontSize: '14px',
              padding: '8px 12px',
              width: '100%',
            }}
            type="text"
            value={title}
          />
        </div>

        <SlugField
          admin={{
            description:
              'Generated automatically from the title above, but you can edit it manually.',
            useAsTitle: 'title',
          }}
          label="URL Slug"
          name="interactiveSlug"
          onChange={(value) => setSlug(value || '')}
          path="interactiveSlug"
          required={false}
          value={slug}
        />

        {slug && (
          <div
            style={{
              backgroundColor: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '6px',
              padding: '12px',
            }}
          >
            <strong>Preview URL:</strong>
            <br />
            <code style={{ fontSize: '14px' }}>https://example.com/articles/{slug}</code>
          </div>
        )}

        <div
          style={{
            backgroundColor: '#f8fafc',
            borderRadius: '6px',
            fontSize: '14px',
            padding: '12px',
          }}
        >
          <strong>Auto-generation rules:</strong>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
            <li>Converts to lowercase</li>
            <li>Replaces spaces with hyphens</li>
            <li>Removes special characters</li>
            <li>Trims leading/trailing hyphens</li>
          </ul>
        </div>
      </div>
    )
  },
}

export const ValidationStates: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h3>Slug Field Validation States</h3>

      <div>
        <h4>Valid Slug</h4>
        <SlugField
          admin={{
            useAsTitle: 'title',
          }}
          label="Valid Slug"
          name="validSlug"
          path="validSlug"
          required={false}
          value="valid-url-slug"
        />
      </div>

      <div>
        <h4>Slug with Numbers</h4>
        <SlugField
          admin={{
            useAsTitle: 'title',
          }}
          label="Slug with Numbers"
          name="numberedSlug"
          path="numberedSlug"
          required={false}
          value="article-123-update-2024"
        />
      </div>

      <div>
        <h4>Required but Empty</h4>
        <SlugField
          admin={{
            description: 'This slug field is required but currently empty.',
            useAsTitle: 'title',
          }}
          label="Required Slug"
          name="requiredEmpty"
          path="requiredEmpty"
          required={true}
          value=""
        />
      </div>

      <div>
        <h4>Long Slug</h4>
        <SlugField
          admin={{
            useAsTitle: 'title',
          }}
          label="Long Slug"
          name="longSlug"
          path="longSlug"
          required={false}
          value="this-is-a-very-long-slug-that-demonstrates-how-the-field-handles-lengthy-urls"
        />
      </div>
    </div>
  ),
}

export const SlugGenerationExamples: Story = {
  render: () => {
    const examples = [
      { slug: 'hello-world', title: 'Hello World!' },
      { slug: 'getting-started-with-payload-cms', title: 'Getting Started with Payload CMS' },
      { slug: 'react-nextjs-tutorial', title: 'React & Next.js Tutorial' },
      { slug: '2024-year-end-review', title: '2024 Year-End Review' },
      { slug: 'api-documentation-v20', title: 'API Documentation v2.0' },
      { slug: 'user-guide-setup-configuration', title: 'User Guide: Setup & Configuration' },
    ]

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h3>Slug Generation Examples</h3>
          <p>These examples show how different titles convert to URL-friendly slugs:</p>
        </div>

        <div style={{ display: 'grid', gap: '20px' }}>
          {examples.map(({ slug, title }, index) => (
            <div key={index} style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '16px' }}>
              <div style={{ marginBottom: '8px' }}>
                <strong>Title:</strong> "{title}"
              </div>
              <SlugField
                admin={{
                  useAsTitle: 'title',
                }}
                label="Generated Slug"
                name={`example${index}`}
                path={`example${index}`}
                required={false}
                value={slug}
              />
            </div>
          ))}
        </div>
      </div>
    )
  },
}

export const RealWorldExamples: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <h3>Real-world Slug Field Examples</h3>

      <div>
        <h4>Blog Post</h4>
        <div style={{ marginBottom: '12px' }}>
          <strong>Post Title:</strong> "Building Better APIs with Payload CMS"
        </div>
        <SlugField
          admin={{
            description: 'This slug will be used in the blog post URL: /blog/[slug]',
            useAsTitle: 'title',
          }}
          label="Post Slug"
          name="blogSlug"
          path="blogSlug"
          required={true}
          value="building-better-apis-with-payload-cms"
        />
      </div>

      <div>
        <h4>Product Page</h4>
        <div style={{ marginBottom: '12px' }}>
          <strong>Product Name:</strong> "Premium WordPress Hosting Plan"
        </div>
        <SlugField
          admin={{
            description: 'Product URL: /products/[slug]. Keep it short and descriptive.',
            useAsTitle: 'name',
          }}
          label="Product Slug"
          name="productSlug"
          path="productSlug"
          required={true}
          value="premium-wordpress-hosting"
        />
      </div>

      <div>
        <h4>Team Member Profile</h4>
        <div style={{ marginBottom: '12px' }}>
          <strong>Team Member:</strong> "Sarah Johnson - Lead Developer"
        </div>
        <SlugField
          admin={{
            description: 'Team member profile URL: /team/[slug]',
            useAsTitle: 'fullName',
          }}
          label="Profile Slug"
          name="teamSlug"
          path="teamSlug"
          required={false}
          value="sarah-johnson"
        />
      </div>

      <div>
        <h4>Documentation Section</h4>
        <div style={{ marginBottom: '12px' }}>
          <strong>Section Title:</strong> "Authentication & Security"
        </div>
        <SlugField
          admin={{
            description: 'Documentation URL: /docs/[slug]. Should be clear and hierarchical.',
            useAsTitle: 'sectionTitle',
          }}
          label="Documentation Slug"
          name="docsSlug"
          path="docsSlug"
          required={true}
          value="authentication-security"
        />
      </div>

      <div>
        <h4>Event Page</h4>
        <div style={{ marginBottom: '12px' }}>
          <strong>Event:</strong> "React Conference 2024 - San Francisco"
        </div>
        <SlugField
          admin={{
            description: 'Event page URL: /events/[slug]. Include year and location if relevant.',
            useAsTitle: 'eventTitle',
          }}
          label="Event Slug"
          name="eventSlug"
          path="eventSlug"
          required={true}
          value="react-conference-2024-san-francisco"
        />
      </div>

      <div>
        <h4>Category Page</h4>
        <div style={{ marginBottom: '12px' }}>
          <strong>Category:</strong> "Web Development & Design"
        </div>
        <SlugField
          admin={{
            description:
              'Category archive URL: /category/[slug]. Keep consistent with site structure.',
            useAsTitle: 'categoryName',
          }}
          label="Category Slug"
          name="categorySlug"
          path="categorySlug"
          required={true}
          value="web-development-design"
        />
      </div>
    </div>
  ),
}
