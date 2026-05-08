'use client'
import React, { useState } from 'react'

import { InputStepper } from '../../elements/InputStepper/index.js'
import { FieldDescription } from '../FieldDescription/index.js'
import { FieldLabel } from '../FieldLabel/index.js'
import { fieldBaseClass } from '../shared/index.js'

export const meta = {
  description: 'Longitude/latitude coordinate pair input for geographic point data.',
  title: 'Fields / Point',
}

const baseClass = 'point'

export const Default = () => {
  const [longitude, setLongitude] = useState<number | string>('')
  const [latitude, setLatitude] = useState<number | string>('')
  return (
    <div className={[fieldBaseClass, baseClass].join(' ')}>
      <ul className={`${baseClass}__wrap`}>
        <li>
          <FieldLabel label="Location — Longitude" path="location" />
          <div className="form-input-group">
            <input
              aria-label="Longitude"
              className="form-input"
              id="field-longitude-location"
              name="location.longitude"
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="Longitude"
              type="number"
              value={longitude}
            />
            <InputStepper
              disabled={false}
              onDecrement={() => setLongitude((prev) => (prev === '' ? -1 : Number(prev) - 1))}
              onIncrement={() => setLongitude((prev) => (prev === '' ? 1 : Number(prev) + 1))}
            />
          </div>
        </li>
        <li>
          <FieldLabel label="Location — Latitude" path="location" />
          <div className="form-input-group">
            <input
              aria-label="Latitude"
              className="form-input"
              id="field-latitude-location"
              name="location.latitude"
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="Latitude"
              type="number"
              value={latitude}
            />
            <InputStepper
              disabled={false}
              onDecrement={() => setLatitude((prev) => (prev === '' ? -1 : Number(prev) - 1))}
              onIncrement={() => setLatitude((prev) => (prev === '' ? 1 : Number(prev) + 1))}
            />
          </div>
        </li>
      </ul>
    </div>
  )
}

export const WithValue = () => {
  const [longitude, setLongitude] = useState<number | string>(-73.935242)
  const [latitude, setLatitude] = useState<number | string>(40.73061)
  return (
    <div className={[fieldBaseClass, baseClass].join(' ')}>
      <ul className={`${baseClass}__wrap`}>
        <li>
          <FieldLabel label="Office — Longitude" path="office" />
          <div className="form-input-group">
            <input
              aria-label="Longitude"
              className="form-input"
              id="field-longitude-office"
              name="office.longitude"
              onChange={(e) => setLongitude(e.target.value)}
              type="number"
              value={longitude}
            />
            <InputStepper
              disabled={false}
              onDecrement={() => setLongitude((prev) => Number(prev) - 1)}
              onIncrement={() => setLongitude((prev) => Number(prev) + 1)}
            />
          </div>
        </li>
        <li>
          <FieldLabel label="Office — Latitude" path="office" />
          <div className="form-input-group">
            <input
              aria-label="Latitude"
              className="form-input"
              id="field-latitude-office"
              name="office.latitude"
              onChange={(e) => setLatitude(e.target.value)}
              type="number"
              value={latitude}
            />
            <InputStepper
              disabled={false}
              onDecrement={() => setLatitude((prev) => Number(prev) - 1)}
              onIncrement={() => setLatitude((prev) => Number(prev) + 1)}
            />
          </div>
        </li>
      </ul>
      <FieldDescription description="Coordinates for the New York office." path="office" />
    </div>
  )
}

export const ReadOnly = () => (
  <div className={[fieldBaseClass, baseClass, 'read-only'].join(' ')}>
    <ul className={`${baseClass}__wrap`}>
      <li>
        <FieldLabel label="Pin — Longitude" path="pin" />
        <div className="form-input-group">
          <input
            aria-label="Longitude"
            className="form-input"
            disabled
            id="field-longitude-pin"
            name="pin.longitude"
            onChange={() => {}}
            type="number"
            value={2.3522}
          />
          <InputStepper disabled onDecrement={() => {}} onIncrement={() => {}} />
        </div>
      </li>
      <li>
        <FieldLabel label="Pin — Latitude" path="pin" />
        <div className="form-input-group">
          <input
            aria-label="Latitude"
            className="form-input"
            disabled
            id="field-latitude-pin"
            name="pin.latitude"
            onChange={() => {}}
            type="number"
            value={48.8566}
          />
          <InputStepper disabled onDecrement={() => {}} onIncrement={() => {}} />
        </div>
      </li>
    </ul>
  </div>
)
