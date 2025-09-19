/* eslint-disable no-restricted-exports */
import type { Meta, StoryObj } from '@storybook/react-vite'

import React, { useState } from 'react'

import { DatePickerField } from './index.js'

const meta: Meta<typeof DatePickerField> = {
  component: DatePickerField,
  parameters: {
    docs: {
      description: {
        component:
          'A date picker component with multiple appearance modes and internationalization support.',
      },
    },
    payloadContext: true,
  },
  title: 'Elements/DatePicker',
}

export default meta

type Story = StoryObj<typeof meta>

const containerStyles: React.CSSProperties = {
  alignItems: 'center',
  display: 'flex',
  flexDirection: 'column',
  gap: '40px',
  justifyContent: 'center',
  margin: '0 auto',
  maxWidth: '900px',
  minHeight: '100vh',
  padding: '40px 20px',
  width: '100%',
}

const DatePickerDemo: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  return (
    <div style={containerStyles}>
      <div style={{ textAlign: 'center' }}>
        <h3 style={{ fontSize: '18px', margin: '0 0 15px 0' }}>Default Date Picker</h3>
        <p
          style={{
            color: 'var(--theme-elevation-500)',
            fontSize: '14px',
            margin: '0 0 30px 0',
            maxWidth: '400px',
          }}
        >
          Click the calendar icon to open the date picker and select a date
        </p>
      </div>

      <div style={{ maxWidth: '400px', minWidth: '300px', width: '100%' }}>
        <DatePickerField
          onChange={(date) => setSelectedDate(date)}
          placeholder="Select a date"
          value={selectedDate}
        />
      </div>

      {selectedDate && (
        <div
          style={{
            backgroundColor: 'var(--theme-elevation-50)',
            border: '1px solid var(--theme-elevation-100)',
            borderRadius: '4px',
            color: 'var(--theme-elevation-600)',
            fontSize: '14px',
            padding: '15px 20px',
            textAlign: 'center',
          }}
        >
          <strong>Selected Date:</strong> {selectedDate.toLocaleDateString()}
        </div>
      )}
    </div>
  )
}

export const Basic: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Basic usage of DatePicker with default appearance and date selection.',
      },
    },
  },
  render: () => <DatePickerDemo />,
}

const DateAndTimeDemo: React.FC = () => {
  const [selectedDateTime, setSelectedDateTime] = useState<Date | undefined>(new Date())

  return (
    <div style={containerStyles}>
      <div style={{ textAlign: 'center' }}>
        <h3 style={{ fontSize: '18px', margin: '0 0 15px 0' }}>Date and Time Picker</h3>
        <p
          style={{
            color: 'var(--theme-elevation-500)',
            fontSize: '14px',
            margin: '0 0 30px 0',
            maxWidth: '400px',
          }}
        >
          Select both date and time with the dayAndTime appearance mode
        </p>
      </div>

      <div style={{ maxWidth: '400px', minWidth: '300px', width: '100%' }}>
        <DatePickerField
          onChange={(date) => setSelectedDateTime(date)}
          pickerAppearance="dayAndTime"
          placeholder="Select date and time"
          value={selectedDateTime}
        />
      </div>

      {selectedDateTime && (
        <div
          style={{
            backgroundColor: 'var(--theme-elevation-50)',
            border: '1px solid var(--theme-elevation-100)',
            borderRadius: '4px',
            color: 'var(--theme-elevation-600)',
            fontSize: '14px',
            padding: '15px 20px',
            textAlign: 'center',
          }}
        >
          <strong>Selected Date & Time:</strong> {selectedDateTime.toLocaleString()}
        </div>
      )}
    </div>
  )
}

export const WithTime: Story = {
  parameters: {
    docs: {
      description: {
        story: 'DatePicker with day and time selection enabled.',
      },
    },
  },
  render: () => <DateAndTimeDemo />,
}
