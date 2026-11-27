import { expect, test } from 'vitest'
import { page } from 'vitest/browser'
import { render } from 'vitest-browser-react'

import { RenderIfInViewport } from '../../elements/RenderIfInViewport/index.js'
import '../../css/spacing.css'
import '../../forms/RenderFields/index.css'
import './index.css'

test('removes bottom margin from rendered empty rows while preserving margin before viewport render', async () => {
  await page.viewport(800, 600)

  const screen = await render(
    <div className="render-fields">
      <div className="field-type row" data-testid="rendered-hidden-row">
        <RenderIfInViewport className="render-fields row__fields" forceRender>
          {null}
        </RenderIfInViewport>
      </div>

      <div className="field-type row" data-testid="rendered-visible-row">
        <RenderIfInViewport className="render-fields row__fields" forceRender>
          <div className="field-type text">Visible field</div>
        </RenderIfInViewport>
      </div>

      <div className="field-type row" data-testid="no-fields-row" />

      <div style={{ height: '2500px' }} />

      <div className="field-type row" data-testid="unrendered-below-fold-row">
        <RenderIfInViewport className="render-fields row__fields">{null}</RenderIfInViewport>
      </div>

      <div className="field-type text">Trailing field</div>
    </div>,
  )

  const renderedHiddenRow = screen.getByTestId('rendered-hidden-row').element()
  const renderedVisibleRow = screen.getByTestId('rendered-visible-row').element()
  const noFieldsRow = screen.getByTestId('no-fields-row').element()
  const unrenderedRow = screen.getByTestId('unrendered-below-fold-row').element()

  expect(renderedHiddenRow.querySelector('.row__fields')).toHaveAttribute('data-rendered', '')
  expect(getComputedStyle(renderedHiddenRow).marginBottom).toBe('0px')

  expect(renderedVisibleRow.querySelector('.row__fields')).toHaveAttribute('data-rendered', '')
  expect(parseFloat(getComputedStyle(renderedVisibleRow).marginBottom)).toBeGreaterThan(0)

  expect(getComputedStyle(noFieldsRow).marginBottom).toBe('0px')

  expect(unrenderedRow.querySelector('.row__fields')).not.toHaveAttribute('data-rendered')
  expect(parseFloat(getComputedStyle(unrenderedRow).marginBottom)).toBeGreaterThan(0)

  unrenderedRow.scrollIntoView()

  await expect
    .poll(() => unrenderedRow.querySelector('.row__fields')?.hasAttribute('data-rendered'))
    .toBe(true)
  expect(getComputedStyle(unrenderedRow).marginBottom).toBe('0px')
})
