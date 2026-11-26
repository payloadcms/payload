'use client'

import { DatePicker } from '@payloadcms/ui'
import { useState } from 'react'

type DateRange = [Date | null, Date | null]

export const RangePicker = () => {
  const [range, setRange] = useState<DateRange>([null, null])

  return (
    <>
      <label htmlFor="date-range">Date range</label>
      <DatePicker
        onChange={(value) => setRange(value as unknown as DateRange)}
        overrides={{
          id: 'date-range',
          endDate: range[1],
          excludeDates: [new Date(2026, 10, 15)],
          openToDate: new Date(2026, 10, 1),
          selectsDisabledDaysInRange: true,
          selectsRange: true,
          startDate: range[0],
        }}
        value={range[0] ?? undefined}
      />
    </>
  )
}
