import type { Meta, StoryObj } from '@storybook/react-vite'

import React, { useState } from 'react'

import { Button } from '../Button/index.js'
import { AnimateHeight } from './index.js'

const meta: Meta<typeof AnimateHeight> = {
  argTypes: {
    id: {
      control: 'text',
      description: 'HTML id attribute',
      table: {
        type: { summary: 'string' },
        category: 'Accessibility',
      },
    },
    children: {
      control: false,
      description: 'Content to animate in and out',
      table: {
        type: { summary: 'React.ReactNode' },
        category: 'Core',
      },
    },
    className: {
      control: 'text',
      description: 'Additional CSS class names',
      table: {
        type: { summary: 'string' },
        category: 'Customization',
      },
    },
    duration: {
      control: { type: 'number', max: 2000, min: 100, step: 100 },
      description: 'Animation duration in milliseconds',
      table: {
        type: { summary: 'number' },
        category: 'Animation',
        defaultValue: { summary: '300' },
      },
    },
    height: {
      control: 'select',
      description: 'Height value that controls the animation state',
      mapping: {
        0: 0,
        200: 200,
        400: 400,
        auto: 'auto',
      },
      options: ['auto', 0, 200, 400],
      table: {
        type: { summary: "'auto' | number" },
        category: 'Core',
      },
    },
  },
  component: AnimateHeight,
  decorators: [
    (Story) => (
      <div style={{ fontFamily: 'system-ui, sans-serif', padding: '20px' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'An animation wrapper component that smoothly animates height changes. Perfect for collapsible content, dropdowns, and expandable sections.',
      },
    },
    layout: 'centered',
  },
  title: 'Elements/AnimateHeight',
}

export default meta
type Story = StoryObj<typeof AnimateHeight>

// Interactive demo showing how the component works
const InteractiveDemo: React.FC<{ duration?: number }> = ({ duration = 300 }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [content, setContent] = useState('short')

  const contentVariants = {
    long: 'This is long content that will really test the animation capabilities of the AnimateHeight component. It includes multiple paragraphs and demonstrates how the component handles substantial content changes while maintaining smooth animations. The component uses ResizeObserver to track content changes and adjusts the animation accordingly.',
    medium:
      'This is medium content that will demonstrate how the AnimateHeight component handles different content lengths. It shows the smooth transition between states.',
    short: 'This is short content that will animate smoothly.',
  }

  return (
    <div
      style={{
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        overflow: 'hidden',
        width: '400px',
      }}
    >
      <div style={{ background: '#f5f5f5', borderBottom: '1px solid #e0e0e0', padding: '16px' }}>
        <h3 style={{ fontSize: '16px', margin: '0 0 12px 0' }}>AnimateHeight Demo</h3>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            style={{
              background: isOpen ? '#007bff' : '#fff',
              border: '1px solid #ccc',
              borderRadius: '4px',
              color: isOpen ? '#fff' : '#333',
              cursor: 'pointer',
              padding: '6px 12px',
            }}
            type="button"
          >
            {isOpen ? 'Close' : 'Open'}
          </button>
          <select
            onChange={(e) => setContent(e.target.value as keyof typeof contentVariants)}
            style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '6px' }}
            value={content}
          >
            <option value="short">Short Content</option>
            <option value="medium">Medium Content</option>
            <option value="long">Long Content</option>
          </select>
        </div>
        <div style={{ color: '#666', fontSize: '12px' }}>
          Duration: {duration}ms | Height: {isOpen ? 'auto' : '0px'}
        </div>
      </div>
      <AnimateHeight duration={duration} height={isOpen ? 'auto' : 0}>
        <div style={{ padding: '16px' }}>
          <p style={{ margin: '0 0 12px 0' }}>{contentVariants[content]}</p>
          {content === 'long' && (
            <>
              <p style={{ margin: '0 0 12px 0' }}>
                The component automatically handles content changes and adjusts the animation height
                accordingly. It uses modern CSS features when available and falls back to
                JavaScript-based animation for older browsers.
              </p>
              <p style={{ margin: '0' }}>
                This demonstrates the ResizeObserver integration that tracks content size changes
                during animation.
              </p>
            </>
          )}
        </div>
      </AnimateHeight>
    </div>
  )
}

// Basic usage - simple toggle
export const Basic: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Basic usage showing how AnimateHeight works with a simple toggle. Click the button to see the smooth height animation.',
      },
    },
  },
  render: () => <InteractiveDemo />,
}

// Real-world example - FAQ section
export const FAQExample: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Real-world example showing AnimateHeight used in an FAQ section. This demonstrates how the component works in a practical application with multiple collapsible items.',
      },
    },
  },
  render: () => {
    const [openItem, setOpenItem] = useState<null | number>(null)

    const faqItems = [
      {
        answer:
          'AnimateHeight is a React component that provides smooth height animations for collapsible content. It automatically calculates content height and animates between states.',
        question: 'What is AnimateHeight?',
      },
      {
        answer:
          'The component uses ResizeObserver to track content changes and automatically adjusts the animation height. It works with any content size from a single line to multiple paragraphs.',
        question: 'How does it handle different content sizes?',
      },
      {
        answer:
          'Yes! The component includes proper ARIA attributes and semantic HTML. It sets aria-hidden on the container when closed and maintains proper focus management.',
        question: 'Is it accessible?',
      },
      {
        answer:
          'The component uses modern CSS features when available (like interpolate-size) and falls back to JavaScript-based animation for older browsers, ensuring broad compatibility.',
        question: 'What browsers are supported?',
      },
    ]

    return (
      <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', width: '500px' }}>
        <div style={{ background: '#f8f9fa', borderBottom: '1px solid #e0e0e0', padding: '20px' }}>
          <h2 style={{ fontSize: '20px', margin: '0' }}>Frequently Asked Questions</h2>
        </div>
        {faqItems.map((item, index) => (
          <div key={index} style={{ borderBottom: '1px solid #e0e0e0' }}>
            <Button
              buttonStyle="none"
              icon={openItem === index ? 'chevron' : 'chevron'}
              iconPosition="right"
              onClick={() => setOpenItem(openItem === index ? null : index)}
              type="button"
            >
              <span>{item.question}</span>
              <span
                style={{
                  transform: openItem === index ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                }}
              >
                ▼
              </span>
            </Button>
            <AnimateHeight duration={300} height={openItem === index ? 'auto' : 0}>
              <div style={{ color: '#666', padding: '0 20px 16px 20px' }}>{item.answer}</div>
            </AnimateHeight>
          </div>
        ))}
      </div>
    )
  },
}
