import type { FlattenedField } from 'payload'

import { describe, expect, it } from 'vitest'

import { collectTimezoneCompanionFields } from './collectTimezoneCompanionFields.js'

describe('collectTimezoneCompanionFields', () => {
  it('should return empty set for fields without date timezone', () => {
    const fields: FlattenedField[] = [
      { name: 'title', type: 'text' },
      { name: 'description', type: 'textarea' },
    ]

    const result = collectTimezoneCompanionFields(fields)

    expect(result.size).toBe(0)
  })

  it('should return empty set for date fields without timezone enabled', () => {
    const fields: FlattenedField[] = [
      { name: 'publishedAt', type: 'date' },
      { name: 'createdAt', type: 'date' },
    ]

    const result = collectTimezoneCompanionFields(fields)

    expect(result.size).toBe(0)
  })

  it('should collect timezone companion from the next select field after date with timezone', () => {
    // Simulates sanitized fields where Payload inserts the companion right after the date
    const fields: FlattenedField[] = [
      { name: 'publishedAt', type: 'date', timezone: true },
      { name: 'publishedAt_tz', type: 'select', options: [] }, // auto-generated companion
    ]

    const result = collectTimezoneCompanionFields(fields)

    expect(result.size).toBe(1)
    expect(result.has('publishedAt_tz')).toBe(true)
  })

  it('should handle overridden timezone field names', () => {
    // User overrode the timezone field name via timezone.override
    const fields: FlattenedField[] = [
      { name: 'publishedAt', type: 'date', timezone: true },
      { name: 'pub_timezone', type: 'select', options: [] }, // overridden name
    ]

    const result = collectTimezoneCompanionFields(fields)

    expect(result.size).toBe(1)
    expect(result.has('pub_timezone')).toBe(true)
    expect(result.has('publishedAt_tz')).toBe(false)
  })

  it('should collect multiple timezone companions', () => {
    const fields: FlattenedField[] = [
      { name: 'publishedAt', type: 'date', timezone: true },
      { name: 'publishedAt_tz', type: 'select', options: [] },
      { name: 'title', type: 'text' },
      { name: 'scheduledAt', type: 'date', timezone: true },
      { name: 'scheduledAt_tz', type: 'select', options: [] },
    ]

    const result = collectTimezoneCompanionFields(fields)

    expect(result.size).toBe(2)
    expect(result.has('publishedAt_tz')).toBe(true)
    expect(result.has('scheduledAt_tz')).toBe(true)
  })

  it('should handle date fields in groups', () => {
    const fields: FlattenedField[] = [
      {
        name: 'meta',
        type: 'group',
        fields: [
          { name: 'publishedAt', type: 'date', timezone: true },
          { name: 'publishedAt_tz', type: 'select', options: [] },
        ],
      },
    ]

    const result = collectTimezoneCompanionFields(fields)

    expect(result.size).toBe(1)
    expect(result.has('meta_publishedAt_tz')).toBe(true)
  })

  it('should handle date fields in arrays', () => {
    const fields: FlattenedField[] = [
      {
        name: 'events',
        type: 'array',
        fields: [
          { name: 'startTime', type: 'date', timezone: true },
          { name: 'startTime_tz', type: 'select', options: [] },
        ],
      },
    ]

    const result = collectTimezoneCompanionFields(fields)

    expect(result.size).toBe(1)
    expect(result.has('events_startTime_tz')).toBe(true)
  })

  it('should handle date fields in blocks', () => {
    const fields: FlattenedField[] = [
      {
        name: 'layout',
        type: 'blocks',
        blocks: [
          {
            slug: 'event',
            fields: [
              { name: 'eventDate', type: 'date', timezone: true },
              { name: 'eventDate_tz', type: 'select', options: [] },
            ],
          },
        ],
      },
    ]

    const result = collectTimezoneCompanionFields(fields)

    expect(result.size).toBe(1)
    expect(result.has('layout_event_eventDate_tz')).toBe(true)
  })

  it('should handle deeply nested date fields', () => {
    const fields: FlattenedField[] = [
      {
        name: 'content',
        type: 'group',
        fields: [
          {
            name: 'schedule',
            type: 'array',
            fields: [
              { name: 'time', type: 'date', timezone: true },
              { name: 'time_tz', type: 'select', options: [] },
            ],
          },
        ],
      },
    ]

    const result = collectTimezoneCompanionFields(fields)

    expect(result.size).toBe(1)
    expect(result.has('content_schedule_time_tz')).toBe(true)
  })

  it('should handle tabs', () => {
    const fields: FlattenedField[] = [
      {
        type: 'tabs',
        tabs: [
          {
            name: 'scheduling',
            fields: [
              { name: 'publishAt', type: 'date', timezone: true },
              { name: 'publishAt_tz', type: 'select', options: [] },
            ],
          },
        ],
      },
    ]

    const result = collectTimezoneCompanionFields(fields)

    expect(result.size).toBe(1)
    expect(result.has('scheduling_publishAt_tz')).toBe(true)
  })

  it('should handle unnamed tabs (no prefix added)', () => {
    const fields: FlattenedField[] = [
      {
        type: 'tabs',
        tabs: [
          {
            fields: [
              { name: 'publishAt', type: 'date', timezone: true },
              { name: 'publishAt_tz', type: 'select', options: [] },
            ],
          },
        ],
      },
    ]

    const result = collectTimezoneCompanionFields(fields)

    expect(result.size).toBe(1)
    expect(result.has('publishAt_tz')).toBe(true)
  })

  it('should not include user-defined fields ending with _tz', () => {
    const fields: FlattenedField[] = [
      { name: 'my_tz', type: 'text' },
      { name: 'timezone_tz', type: 'select', options: [] },
      { name: 'publishedAt', type: 'date', timezone: true },
      { name: 'publishedAt_tz', type: 'select', options: [] }, // actual companion
    ]

    const result = collectTimezoneCompanionFields(fields)

    // Only the auto-generated timezone companion should be included
    expect(result.size).toBe(1)
    expect(result.has('publishedAt_tz')).toBe(true)
    expect(result.has('my_tz')).toBe(false)
    expect(result.has('timezone_tz')).toBe(false)
  })

  it('should not collect companion if next field is not a select', () => {
    // Edge case: date with timezone but next field is not a select
    const fields: FlattenedField[] = [
      { name: 'publishedAt', type: 'date', timezone: true },
      { name: 'title', type: 'text' }, // not a select, so not a companion
    ]

    const result = collectTimezoneCompanionFields(fields)

    expect(result.size).toBe(0)
  })

  it('should not collect companion if date is last field', () => {
    const fields: FlattenedField[] = [
      { name: 'title', type: 'text' },
      { name: 'publishedAt', type: 'date', timezone: true },
      // no next field
    ]

    const result = collectTimezoneCompanionFields(fields)

    expect(result.size).toBe(0)
  })
})
