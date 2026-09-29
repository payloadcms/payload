import type { Locator, Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { fileURLToPath } from 'node:url'
import { formatAdminURL } from 'payload/shared'

import type { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'

import { openListColumns } from '../__helpers/e2e/columns/openListColumns.js'
import { addGroupBy, clearGroupBy, openGroupBy } from '../__helpers/e2e/groupBy/index.js'
import { selectInput } from '../__helpers/e2e/selectInput.js'
import { openNav } from '../__helpers/e2e/toggleNav.js'
import {
  addTextBlock,
  cleanupModalMedia,
  expectOptionsToHaveAccessibleNames,
  expectPaintContrast,
  expectTextContrast,
  getFocusIndicatorStyle,
  gotoCreatePost,
  gotoFirstPost,
  gotoPostsList,
  hasRenderedFocusIndicator,
  inContrastThemes,
  openAccessibilityTestPage,
  openAPIKeyDialog,
  openBlockDatePicker,
  openBulkEditFieldSelect,
  openBulkUploadDialog,
  openCopyToLocaleDrawer,
  openDrawerFilters,
  openEditImageDialog,
  openFirstBlockActions,
  openFolderCreationLocation,
  openLivePreview,
  openLocaleOptions,
  openPopupWithKeyboard,
  openPostsFilter,
  openRelationshipCreationDrawer,
  openRichTextRelationshipDrawer,
  openRichTextUploadDrawer,
  openVersionComparison,
  openWidgetDrawer,
} from './helpers.js'

test.describe('WCAG 2.2 Level AA', () => {
  let page: Page
  let postsURL: AdminUrlUtil
  let serverURL: string

  test.beforeAll(async ({ browser }, testInfo) => {
    ;({ page, postsURL, serverURL } = await openAccessibilityTestPage({
      browser,
      testInfo,
    }))
  })

  test.afterEach(async () => {
    await cleanupModalMedia({ page })
  })

  test.afterAll(async () => {
    await page.context().close()
  })

  test.describe('1.3.1 Info and Relationships (A)', () => {
    test('should expose image-edit section titles as headings', async () => {
      // PYLD-3576
      const dialog = await openEditImageDialog({ page, serverURL })

      await expect.soft(dialog.getByRole('heading', { name: 'Crop', exact: true })).toBeVisible()
      await expect
        .soft(dialog.getByRole('heading', { name: 'Focal Point', exact: true }))
        .toBeVisible()
    })

    test('should preserve image-edit title typography when changing spans to headings', async () => {
      const dialog = await openEditImageDialog({ page, serverURL })

      await page.evaluate(() => document.fonts.ready)
      for (const name of ['Crop', 'Focal Point']) {
        const heading = dialog.getByRole('heading', { name, exact: true })

        await expect(heading).toBeVisible()
        const comparison = await compareHeadingWithOriginalSpan({
          heading,
          originalStyle: `
            font-family: var(--text-body-medium-strong-font-family);
            font-size: var(--text-body-medium-strong-font-size);
            font-weight: var(--text-body-medium-strong-font-weight);
            line-height: var(--text-body-medium-strong-line-height);
            color: var(--color-text);
          `,
        })

        await test.info().attach(`${name}-typography-before-after`, {
          body: JSON.stringify(comparison, null, 2),
          contentType: 'application/json',
        })
        expect.soft(comparison.after, name).toEqual(comparison.before)
      }
    })

    test('should expose the folder location column title as a heading', async () => {
      // PYLD-3586
      const modal = await openFolderCreationLocation({ page, serverURL })

      await expect(modal.getByRole('heading', { name: 'All', exact: true })).toBeVisible()
    })

    test('should preserve folder column title typography when changing span to heading', async () => {
      const modal = await openFolderCreationLocation({ page, serverURL })
      const heading = modal.getByRole('heading', { name: 'All', exact: true })

      await expect(heading).toBeVisible()
      await page.evaluate(() => document.fonts.ready)
      const comparison = await compareHeadingWithOriginalSpan({
        heading,
        originalStyle: `
          display: flex; align-items: center; gap: var(--spacer-2);
          font-weight: 500; color: var(--color-text); white-space: nowrap;
          overflow: hidden; text-overflow: ellipsis;
        `,
      })

      await test.info().attach('title-typography-before-after', {
        body: JSON.stringify(comparison, null, 2),
        contentType: 'application/json',
      })
      expect(comparison.after).toEqual(comparison.before)
    })

    test('should preserve the meaning and semantic emphasis of API-key replacement warnings', async () => {
      // PYLD-3616
      const dialog = await openAPIKeyDialog({ page, serverURL })

      // The current UI emphasizes the affected key suffix, rather than the word "invalidate".
      await expect(dialog).toContainText(/invalidate.*1234/i)
      await expect(dialog.locator('strong')).toHaveText('1234')
      // Spoken emphasis depends on screen-reader verbosity; confirm manually with VoiceOver.
    })

    test('should expose the add-widget title as a heading', async () => {
      // PYLD-3648
      const { drawer, trigger } = await openWidgetDrawer({ page, serverURL })

      await trigger.press('Enter')
      await expect(drawer.getByRole('heading', { name: /add widget/i })).toBeVisible()
    })

    test('should expose the relationship creation panel title as a heading', async () => {
      // PYLD-3653
      const drawer = await openRelationshipCreationDrawer({ page, postsURL })

      await expect(drawer.getByRole('heading', { name: /creating new post/i })).toBeVisible()
    })

    test('should give the Copy to locale combobox an accessible name', async () => {
      // PYLD-3687
      const drawer = await openCopyToLocaleDrawer({ page, postsURL, serverURL })
      const combobox = drawer.locator('#field-toLocale input[role="combobox"]')

      await expect(combobox).toHaveAccessibleName(/copy to/i)
    })

    test('should associate the per-page control with the related table', async () => {
      // PYLD-3692
      await gotoPostsList({ page, postsURL })
      const perPageButton = page.locator('.per-page .popup__trigger-wrap button')

      await expect(perPageButton).toHaveAccessibleName(/per page/i)
      await expect(perPageButton).toHaveAttribute('aria-haspopup', /true|menu/)
      const controlledIds = (await perPageButton.getAttribute('aria-controls'))?.split(' ') || []
      const tableId = controlledIds.find((controlledId) =>
        controlledId.startsWith('payload-table-'),
      )

      expect(tableId).toBeTruthy()
      await expect(page.locator(`#${tableId}`)).toHaveCount(1)
    })

    test('should give every grouped table a unique ID', async () => {
      // Additional coverage for PYLD-3692.
      await gotoPostsList({ page, postsURL })
      await addGroupBy(page, {
        fieldLabel: 'Accessibility Select',
        fieldPath: 'accessibilitySelect',
      })
      const tableIds = await page
        .locator('table[id^="payload-table-"]')
        .evaluateAll((tables) => tables.map((table) => table.id))

      expect(tableIds.length).toBeGreaterThan(1)
      expect(new Set(tableIds).size).toBe(tableIds.length)
      await clearGroupBy(page)
    })

    test('should expose the active sort direction on relationship table headers and buttons', async () => {
      // Additional coverage for PYLD-3660.
      const drawer = await openRichTextRelationshipDrawer({ page, postsURL })
      const header = drawer.locator('th:has(.sort-column)').first()
      const label = (await header.locator('.sort-column__label').innerText()).trim()
      const ascendingButton = header.locator('.sort-column__asc')
      const descendingButton = header.locator('.sort-column__desc')

      await expect(header).not.toHaveAttribute('aria-sort', /.+/)

      await ascendingButton.click()
      await expect(header).toHaveAccessibleName(label)
      await expect(header).toHaveAttribute('aria-sort', 'ascending')
      await expect(ascendingButton).toHaveAttribute('aria-pressed', 'true')
      await expect(descendingButton).toHaveAttribute('aria-pressed', 'false')

      await descendingButton.click()
      await expect(header).toHaveAttribute('aria-sort', 'descending')
      await expect(ascendingButton).toHaveAttribute('aria-pressed', 'false')
      await expect(descendingButton).toHaveAttribute('aria-pressed', 'true')
    })
  })

  test.describe('1.4.3 Contrast (Minimum) (AA)', () => {
    for (const theme of ['light', 'dark'] as const) {
      test(`should apply enhanced contrast only while enabled in ${theme} mode`, async () => {
        await page.context().addCookies([
          { name: 'payload-theme', url: serverURL, value: theme },
          { name: 'payload-high-contrast-mode', url: serverURL, value: 'false' },
        ])
        await page.goto(postsURL.account)
        await page.locator('#field-email').fill('contrast-toggle@example.com')
        const toggle = page.locator('#field-highContrastMode')
        const save = page.getByRole('button', { name: 'Save', exact: true })
        await expect(toggle).not.toBeChecked()
        await expect(page.locator('html')).not.toHaveAttribute('data-enhanced-contrast')
        await page.mouse.move(0, 0)
        await expect(save).toHaveCSS('background-color', 'rgb(13, 153, 255)')

        await toggle.check()
        await expect(page.locator('html')).toHaveAttribute('data-enhanced-contrast', '')
        await expect(save).toHaveCSS('background-color', 'rgb(7, 104, 207)')
        await expectTextContrast({ targets: save })
        await page.reload()
        await page.locator('#field-email').fill('contrast-toggle@example.com')
        await expect(toggle).toBeChecked()
        await expect(page.locator('html')).toHaveAttribute('data-enhanced-contrast', '')
        await expect(save).toHaveCSS('background-color', 'rgb(7, 104, 207)')

        await toggle.uncheck()
        await expect(page.locator('html')).not.toHaveAttribute('data-enhanced-contrast')
        await expect(save).toHaveCSS('background-color', 'rgb(13, 153, 255)')
        await page.reload()
        await page.locator('#field-email').fill('contrast-toggle@example.com')
        await expect(toggle).not.toBeChecked()
        await expect(page.locator('html')).not.toHaveAttribute('data-enhanced-contrast')
        await expect(save).toHaveCSS('background-color', 'rgb(13, 153, 255)')
      })
    }

    test('should provide contrast for authentication field errors and error toast text', async () => {
      // PYLD-3608
      await inContrastThemes({
        page,
        run: async () => {
          await page.goto(postsURL.account)
          await page.locator('#field-email').fill('')
          await page.getByRole('button', { name: 'Save', exact: true }).click()
          await expect(page.locator('.field-error').first()).toBeVisible()
          const toast = page.locator('[data-sonner-toast][data-type="error"]').first()
          await expect(toast).toBeVisible()
          await toast.hover()
          await expect(toast).toHaveCSS('opacity', '1')
          await expect(toast).toHaveCSS('filter', /^(none|blur\(0px\))$/)
          await expectTextContrast({
            targets: page.locator('.field-error, [data-sonner-toast][data-type="error"]'),
          })
        },
        serverURL,
        themes: ['light', 'dark'],
      })
    })

    test('should provide enhanced contrast for hovered locale menu text', async () => {
      await inContrastThemes({
        page,
        run: async () => {
          const options = await openLocaleOptions({ page, postsURL })
          await options.first().hover()
          await expectTextContrast({ targets: options.first() })
          await page.mouse.move(0, 0)
          await options.first().focus()
          await expectTextContrast({ targets: options.first() })
        },
        serverURL,
        themes: ['light', 'dark'],
      })
    })

    test('should provide enhanced contrast for selected calendar day text', async () => {
      await inContrastThemes({
        page,
        run: async () => {
          await openBlockDatePicker({ page, postsURL })
          await page
            .locator(
              '.react-datepicker__day:not(.react-datepicker__day--outside-month):not(.react-datepicker__day--disabled)',
            )
            .nth(10)
            .click()
          await page.locator('#field-layout__0__date input').click()
          await page.mouse.move(0, 0)
          const selected = page.locator('.react-datepicker__day--selected')
          await expectTextContrast({ targets: selected })
          await selected.hover()
          await expectTextContrast({ targets: selected })
        },
        serverURL,
        themes: ['light', 'dark'],
      })
    })

    test('should provide contrast for the Forgot password link', async () => {
      // PYLD-3610
      await inContrastThemes({
        page,
        run: async () => {
          const loginPage = await page
            .context()
            .browser()!
            .newPage({ extraHTTPHeaders: { DisableAutologin: 'true' } })
          try {
            const cookies = await page.context().cookies()
            await loginPage
              .context()
              .addCookies(
                cookies.filter(({ name }) =>
                  ['payload-high-contrast-mode', 'payload-theme'].includes(name),
                ),
              )
            await loginPage.goto(postsURL.login)
            await expectTextContrast({ targets: loginPage.getByRole('link', { name: /forgot/i }) })
          } finally {
            await loginPage.context().close()
          }
          await gotoPostsList({ page, postsURL })
        },
        serverURL,
        themes: ['light', 'dark'],
      })
    })

    test('should provide contrast for the navigation folder search placeholder', async () => {
      // PYLD-3646
      await inContrastThemes({
        page,
        run: async () => {
          await gotoPostsList({ page, postsURL })
          await openNav(page)
          await page.getByRole('tab', { name: 'Folders', exact: true }).click()
          await expectTextContrast({
            placeholder: true,
            targets: page.getByPlaceholder('Search folders'),
          })
        },
        serverURL,
        themes: ['light', 'dark'],
      })
    })

    test('should provide contrast for the Collection Query error banner text', async () => {
      // PYLD-3647
      await inContrastThemes({
        page,
        run: async () => {
          await page.goto(postsURL.admin)
          await expectTextContrast({
            targets: page.locator('.collection-query-widget--error'),
          })
        },
        serverURL,
        themes: ['light', 'dark'],
      })
    })

    test('should provide contrast for the enabled Copy to locale button', async () => {
      // PYLD-3674
      await inContrastThemes({
        page,
        run: async () => {
          const drawer = await openCopyToLocaleDrawer({ page, postsURL, serverURL })
          await selectInput({
            multiSelect: false,
            option: 'Spanish',
            page,
            selectLocator: drawer.locator('#field-toLocale'),
          })
          const button = drawer.getByRole('button', { name: 'Copy', exact: true })
          await expect(button).toBeEnabled()
          await expectTextContrast({ targets: button })
          await button.hover()
          await expectTextContrast({ targets: button })
          await page.mouse.move(0, 0)
          await button.focus()
          await expect(button).toBeFocused()
          await expectTextContrast({ targets: button })
        },
        serverURL,
        themes: ['light', 'dark'],
      })
    })

    test('should provide contrast for the unavailable Copy button', async () => {
      // PYLD-3681, PYLD-3683
      await inContrastThemes({
        page,
        run: async () => {
          const drawer = await openCopyToLocaleDrawer({ page, postsURL, serverURL })
          const button = drawer.getByRole('button', { name: 'Copy', exact: true })
          await expect(button).toBeDisabled()
          // Reported readability expectation; inactive controls are exempt from WCAG 1.4.3.
          await expectTextContrast({ targets: button })
        },
        serverURL,
        themes: ['light', 'dark'],
      })
    })

    test('should provide contrast for Copy from and Copy to field content', async () => {
      // PYLD-3684, PYLD-3685
      await inContrastThemes({
        page,
        run: async () => {
          const drawer = await openCopyToLocaleDrawer({ page, postsURL, serverURL })
          await expectTextContrast({
            targets: drawer.locator(
              '#field-fromLocale .rs__single-value, #field-toLocale .rs__placeholder',
            ),
          })
          await selectInput({
            multiSelect: false,
            option: 'Spanish',
            page,
            selectLocator: drawer.locator('#field-toLocale'),
          })
          await expectTextContrast({ targets: drawer.locator('#field-toLocale .rs__single-value') })
        },
        serverURL,
        themes: ['light', 'dark'],
      })
    })

    test('should provide contrast for an added block name', async () => {
      // PYLD-3757
      await inContrastThemes({
        page,
        run: async () => {
          await addTextBlock({ page, postsURL })
          await expectTextContrast({ targets: page.locator('.blocks-field__block-pill') })
          const blockName = page.locator('.blocks-field__row .section-title__input')
          await expectTextContrast({ placeholder: true, targets: blockName })
          await blockName.fill('Contrast block name')
          await expectTextContrast({ targets: blockName })
        },
        serverURL,
        themes: ['light', 'dark'],
      })
    })

    test('should provide contrast for the selected Filters button text', async () => {
      // PYLD-3758
      await inContrastThemes({
        page,
        run: async () => {
          await openPostsFilter({ page, postsURL })
          await expectTextContrast({
            targets: page.locator('.list-controls').getByRole('button', { name: /filters/i }),
          })
        },
        serverURL,
        themes: ['light', 'dark'],
      })
    })

    test('should provide contrast for the list Create New button text', async () => {
      // PYLD-3760
      await inContrastThemes({
        page,
        run: async () => {
          await gotoPostsList({ page, postsURL })
          await expectTextContrast({ targets: page.locator('.list-controls__create-new') })
        },
        serverURL,
        themes: ['light', 'dark'],
      })
    })

    test('should provide contrast for authentication submit buttons', async () => {
      // Additional coverage for PYLD-3760.
      await inContrastThemes({
        page,
        run: async () => {
          const loginPage = await page
            .context()
            .browser()!
            .newPage({ extraHTTPHeaders: { DisableAutologin: 'true' } })
          try {
            const cookies = await page.context().cookies()
            await loginPage
              .context()
              .addCookies(
                cookies.filter(({ name }) =>
                  ['payload-high-contrast-mode', 'payload-theme'].includes(name),
                ),
              )
            await loginPage.goto(postsURL.login)
            await expectTextContrast({ targets: loginPage.locator('button[type="submit"]') })
            await loginPage.getByRole('link', { name: /forgot/i }).click()
            await expect(loginPage.locator('.forgot-password__form')).toBeVisible()
            await expectTextContrast({ targets: loginPage.locator('button[type="submit"]') })
          } finally {
            await loginPage.context().close()
          }
          await gotoPostsList({ page, postsURL })
        },
        serverURL,
        themes: ['light', 'dark'],
      })
    })

    test('should provide contrast for trash and restore confirmation buttons', async () => {
      // Additional coverage for PYLD-3760.
      await inContrastThemes({
        page,
        run: async () => {
          await gotoFirstPost({ page, postsURL, serverURL })
          await page.locator('.doc-controls__popup .popup__trigger-wrap button').click()
          await page.locator('#action-delete').click()
          const confirmation = page.locator('[data-dialog-action="confirm"]:visible')
          await expectTextContrast({ targets: confirmation })
          await page.locator('#delete-forever').check()
          await expectTextContrast({ targets: confirmation })
          await page.locator('[data-dialog-action="cancel"]:visible').click()
          await page.goto(postsURL.trash)
          await page.getByRole('link', { name: 'Contrast trashed post', exact: true }).click()
          await page.locator('#action-restore').click()
          await expectTextContrast({
            targets: page.locator('[data-dialog-action="confirm"]:visible'),
          })
          await page.locator('[data-dialog-action="cancel"]:visible').click()
        },
        serverURL,
        themes: ['light', 'dark'],
      })
    })

    test('should provide contrast for navigation text while creating a document', async () => {
      // PYLD-3761
      await inContrastThemes({
        page,
        run: async () => {
          await gotoCreatePost({ page, postsURL })
          await openNav(page)
          await page.getByRole('tab', { name: 'Collections', exact: true }).click()
          await expectTextContrast({
            targets: page.locator(
              '.nav a:visible, .step-nav button:visible, .step-nav a:visible, .step-nav span:visible',
            ),
          })
        },
        serverURL,
        themes: ['light', 'dark'],
      })
    })

    test('should provide contrast for pagination text', async () => {
      // PYLD-3762
      await inContrastThemes({
        page,
        run: async () => {
          await page.goto(`${postsURL.list}?limit=1`)
          await expect(page.locator('tbody tr').first()).toBeVisible()
          await expect(page.locator('.paginator__page-input')).toBeEnabled()
          await expectTextContrast({
            targets: page.locator('.paginator, .per-page, .list-controls__page-info'),
          })
          await page.goto(`${postsURL.list}?limit=10`)
        },
        serverURL,
        themes: ['light', 'dark'],
      })
    })

    test('should provide contrast for the collection search hint', async () => {
      // PYLD-3766
      await inContrastThemes({
        page,
        run: async () => {
          await gotoPostsList({ page, postsURL })
          await expectTextContrast({
            placeholder: true,
            targets: page.getByRole('textbox', { name: 'Search', exact: true }),
          })
        },
        serverURL,
        themes: ['light', 'dark'],
      })
    })

    test('should provide contrast for table text', async () => {
      // PYLD-3767
      await inContrastThemes({
        page,
        run: async () => {
          await gotoPostsList({ page, postsURL })
          await expectTextContrast({ targets: page.locator('table') })
        },
        serverURL,
        themes: ['light', 'dark'],
      })
    })

    test('should provide contrast for the locale picker text', async () => {
      // PYLD-3804
      await inContrastThemes({
        page,
        run: async () => {
          await openLocaleOptions({ page, postsURL })
          await expectTextContrast({
            targets: page.locator('.localizer, .popup__content .popup-button-list__button'),
          })
        },
        serverURL,
        themes: ['light', 'dark'],
      })
    })

    test('should provide contrast for the document time ago timestamp', async () => {
      // PYLD-3805
      await inContrastThemes({
        page,
        run: async () => {
          await gotoFirstPost({ page, postsURL, serverURL })
          await expectTextContrast({
            targets: page.locator('.doc-controls__value-wrap .doc-controls__value'),
          })
        },
        serverURL,
        themes: ['light', 'dark'],
      })
    })

    test('should provide contrast for the currently viewing version metadata', async () => {
      // PYLD-3806
      await inContrastThemes({
        page,
        run: async () => {
          await openVersionComparison({ page, postsURL, serverURL })
          await expectTextContrast({ targets: page.locator('.view-version__version-to-labels') })
        },
        serverURL,
        themes: ['light', 'dark'],
      })
    })

    test('should provide enhanced contrast for hovered version option dates', async () => {
      await inContrastThemes({
        page,
        run: async () => {
          await openVersionComparison({ page, postsURL, serverURL })
          await page.locator('.view-version__version-from .rs__control').click()
          const option = page.locator('.rs__option').first()

          await expect(option).toBeVisible()
          await option.hover()
          await expect(option).toHaveClass(/rs__option--is-focused/)
          await expectTextContrast({ targets: option.locator('.version-pill-label-date') })
        },
        serverURL,
        themes: ['light', 'dark'],
      })
    })

    test('should measure filled textarea text contrast', async () => {
      await inContrastThemes({
        page,
        run: async () => {
          await gotoCreatePost({ page, postsURL })
          const textarea = page.locator('#field-contrastSEO__description')

          await textarea.fill('Visible textarea text')
          // The current value can differ from the default text node in an uncontrolled textarea.
          await expect(async () => {
            await textarea.evaluate((element: HTMLTextAreaElement) => {
              element.defaultValue = ''
            })
            await expect(textarea).toHaveValue('Visible textarea text')
            await expect(textarea).toHaveText('')
          }).toPass()
          await expectTextContrast({ targets: textarea })
        },
        serverURL,
        themes: ['light', 'dark'],
      })
    })

    test('should provide enhanced contrast for version diff text', async () => {
      await inContrastThemes({
        page,
        run: async () => {
          await openVersionComparison({ page, postsURL, serverURL })
          await expect(page.locator('.html-diff [data-match-type="delete"]').first()).toBeVisible()
          await expectTextContrast({ targets: page.locator('.html-diff') })
        },
        serverURL,
        themes: ['light', 'dark'],
      })
    })

    test('should provide contrast for a field description', async () => {
      // PYLD-3808
      await inContrastThemes({
        page,
        run: async () => {
          await gotoCreatePost({ page, postsURL })
          await expectTextContrast({ targets: page.locator('.field-description-subtitle') })
        },
        serverURL,
        themes: ['light', 'dark'],
      })
    })

    test('should provide contrast for read-only hasMany select values', async () => {
      // PYLD-3809
      await inContrastThemes({
        page,
        run: async () => {
          await gotoCreatePost({ page, postsURL })
          const field = page.locator('#field-contrastDisabledSelect')
          await expect(field.locator('input[role="combobox"]')).toBeDisabled()
          // Preserve the report's readability requirement separately from the inactive-control exception.
          await expectTextContrast({ targets: field.locator('.multi-value-label__text') })
        },
        serverURL,
        themes: ['light', 'dark'],
      })
    })

    test('should provide contrast for the Array add row button', async () => {
      // PYLD-3815
      await inContrastThemes({
        page,
        run: async () => {
          await gotoCreatePost({ page, postsURL })
          await expectTextContrast({ targets: page.locator('#field-items .array-field__add-row') })
        },
        serverURL,
        themes: ['light', 'dark'],
      })
    })

    test('should provide contrast for the Blocks add block button', async () => {
      // PYLD-3816
      await inContrastThemes({
        page,
        run: async () => {
          await gotoCreatePost({ page, postsURL })
          await expectTextContrast({
            targets: page.locator('#field-layout .blocks-field__drawer-toggler'),
          })
        },
        serverURL,
        themes: ['light', 'dark'],
      })
    })

    test('should provide contrast for the date timezone label', async () => {
      // PYLD-3820
      await inContrastThemes({
        page,
        run: async () => {
          await gotoCreatePost({ page, postsURL })
          await expectTextContrast({
            targets: page.locator('#field-contrastDate .timezone-picker__label'),
          })
        },
        serverURL,
        themes: ['light', 'dark'],
      })
    })

    test('should provide contrast for a group field description', async () => {
      // PYLD-3821
      await inContrastThemes({
        page,
        run: async () => {
          await gotoCreatePost({ page, postsURL })
          await expectTextContrast({
            targets: page.locator('#field-contrastGroup .field-description'),
          })
        },
        serverURL,
        themes: ['light', 'dark'],
      })
    })

    test('should provide contrast for upload helper and metadata text', async () => {
      // PYLD-3825
      await inContrastThemes({
        page,
        run: async () => {
          await gotoCreatePost({ page, postsURL })
          await expectTextContrast({ targets: page.locator('#field-contrastUpload') })
          await page.locator('#field-contrastUpload .upload__createNewToggler').click()
          const drawer = page.locator('[id^="doc-drawer_media_"]').last()
          await expect(drawer).toBeVisible()
          await drawer
            .locator('input[type="file"]')
            .setInputFiles(fileURLToPath(new URL('../uploads/test-image.png', import.meta.url)))
          await expect(drawer.getByRole('textbox', { name: 'File Name', exact: true })).toHaveValue(
            'test-image.png',
          )
          await expect(drawer.locator('.drawer__fade-in')).toHaveCSS('opacity', '1')
          await expectTextContrast({ targets: drawer.locator('.file-manager__selected-meta') })
        },
        serverURL,
        themes: ['light', 'dark'],
      })
    })

    test('should provide contrast for unselected tab labels', async () => {
      // PYLD-3826
      await inContrastThemes({
        page,
        run: async () => {
          await gotoCreatePost({ page, postsURL })
          const tab = page.getByRole('tab', { name: 'Contrast second tab', exact: true })
          await expect(tab).toHaveAttribute('aria-selected', 'false')
          await expectTextContrast({ targets: tab })
        },
        serverURL,
        themes: ['light', 'dark'],
      })
    })

    test('should provide contrast for SEO length warnings and descriptions', async () => {
      // PYLD-3831
      await inContrastThemes({
        page,
        run: async () => {
          await gotoCreatePost({ page, postsURL })
          const field = page.locator('#field-contrastSEO')

          for (const { descriptionLength, label, titleLength } of [
            { descriptionLength: 0, label: 'Missing', titleLength: 0 },
            { descriptionLength: 5, label: 'Too short', titleLength: 5 },
            { descriptionLength: 95, label: 'Almost there', titleLength: 46 },
            { descriptionLength: 120, label: 'Good', titleLength: 55 },
            { descriptionLength: 151, label: 'Too long', titleLength: 61 },
          ]) {
            await page.locator('#field-contrastSEO__title').fill('a'.repeat(titleLength))
            await page
              .locator('#field-contrastSEO__description')
              .fill('a'.repeat(descriptionLength))
            await expect(
              field.locator('small').filter({ hasText: new RegExp(`^${label}$`) }),
            ).toHaveCount(2)
            await expectTextContrast({ targets: field })
          }
        },
        serverURL,
        themes: ['light', 'dark'],
      })
    })
  })

  test.describe('1.4.10 Reflow (AA)', () => {
    test('should ellipsize long selected values without obscuring their remove control', async () => {
      // Additional coverage for PYLD-3811.
      const fieldSelect = await openBulkEditFieldSelect({ page, postsURL })
      await selectInput({
        multiSelect: false,
        option: 'Accessibility Sortable Select',
        page,
        selectLocator: fieldSelect,
      })
      const selectedValue = fieldSelect
        .locator('.rs__multi-value')
        .filter({ hasText: 'Accessibility Sortable Select' })
      const labelWrapper = selectedValue.locator('.multi-value-label')
      const label = selectedValue.locator('.multi-value-label__text')
      const renderedLabel = label.locator(':scope > span')
      const removeButton = selectedValue.locator('.multi-value-remove')
      const [labelWrapperBox, labelBox, removeButtonBox] = await Promise.all([
        labelWrapper.boundingBox(),
        label.boundingBox(),
        removeButton.boundingBox(),
      ])

      expect(labelWrapperBox).not.toBeNull()
      expect(labelBox).not.toBeNull()
      expect(removeButtonBox).not.toBeNull()
      expect(labelBox!.width).toBeLessThanOrEqual(labelWrapperBox!.width)
      expect(labelBox!.x + labelBox!.width).toBeLessThanOrEqual(removeButtonBox!.x)
      const labelMetrics = await label.evaluate((element) => ({
        overflow: getComputedStyle(element).overflow,
        textOverflow: getComputedStyle(element).textOverflow,
      }))
      const wrapperOverflow = await labelWrapper.evaluate(
        (element) => getComputedStyle(element).overflow,
      )
      const renderedLabelMetrics = await renderedLabel.evaluate((element) => ({
        clientWidth: element.clientWidth,
        overflow: getComputedStyle(element).overflow,
        scrollWidth: element.scrollWidth,
        textOverflow: getComputedStyle(element).textOverflow,
      }))

      expect(labelMetrics).toMatchObject({
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      })
      expect(wrapperOverflow).toBe('hidden')
      expect(renderedLabelMetrics).toMatchObject({
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      })
      expect(renderedLabelMetrics.scrollWidth).toBeGreaterThan(renderedLabelMetrics.clientWidth)
      const centers = await selectedValue.evaluate((element) => {
        const chipRect = element.getBoundingClientRect()
        const centerY = (selector: string) => {
          const target = element.querySelector(selector)
          if (!target) {
            return null
          }
          const { height, y } = target.getBoundingClientRect()
          return y + height / 2
        }

        return {
          chip: chipRect.y + chipRect.height / 2,
          icon: centerY('.multi-value-remove__icon'),
          text: centerY('.multi-value-label__text > span'),
        }
      })

      expect(centers.chip).not.toBeNull()
      expect(centers.icon).not.toBeNull()
      expect(centers.text).not.toBeNull()
      expect(Math.abs(centers.text - centers.chip)).toBeLessThanOrEqual(0.5)
      expect(Math.abs(centers.icon - centers.chip)).toBeLessThanOrEqual(0.5)
      await expect(removeButton).toBeVisible()
    })
  })

  test.describe('1.4.11 Non-text Contrast (AA)', () => {
    test('should preserve contrast for the calendar today indicator when brand colors change', async () => {
      // Additional coverage for PYLD-3674.
      await inContrastThemes({
        page,
        run: async () => {
          await openBlockDatePicker({ page, postsURL })
          const today = page.locator('.react-datepicker__day--today:visible')

          await expect(today).not.toHaveClass(/react-datepicker__day--selected/)
          await expectPaintContrast({
            minimum: 3,
            property: 'backgroundColor',
            pseudo: '::after',
            targets: today,
          })
          await today.press(Number(await today.textContent()) === 1 ? 'ArrowRight' : 'ArrowLeft')
          await expect(today).not.toHaveClass(/react-datepicker__day--keyboard-selected/)
          await expectPaintContrast({
            minimum: 3,
            property: 'backgroundColor',
            pseudo: '::after',
            targets: today,
          })
          await today.hover()
          await expectPaintContrast({
            minimum: 3,
            property: 'backgroundColor',
            pseudo: '::after',
            targets: today,
          })
        },
        serverURL,
        themes: ['light', 'dark'],
      })
    })

    for (const { name, selector } of [
      { name: 'text input', selector: '#field-title' },
      { name: 'textarea', selector: '#field-contrastSEO__description' },
      { name: 'select', selector: '#field-accessibilitySelect .rs__control' },
    ]) {
      test(`should provide enhanced contrast for ${name} boundaries`, async () => {
        await inContrastThemes({
          page,
          run: async () => {
            await gotoCreatePost({ page, postsURL })
            const control = page.locator(selector)

            await control.scrollIntoViewIfNeeded()
            await expect(control).not.toBeFocused()
            await expect(control.locator(':focus')).toHaveCount(0)
            await page.mouse.move(0, 0)
            await expectPaintContrast({
              againstParent: true,
              minimum: 3,
              property: 'borderTopColor',
              targets: control,
            })
            await control.hover()
            await expectPaintContrast({
              againstParent: true,
              minimum: 3,
              property: 'borderTopColor',
              targets: control,
            })
          },
          serverURL,
          themes: ['light', 'dark'],
        })
      })
    }

    test('should provide enhanced contrast for upload drawer input boundaries', async () => {
      await inContrastThemes({
        page,
        run: async () => {
          await gotoCreatePost({ page, postsURL })
          await page.locator('#field-contrastUpload .upload__createNewToggler').click()
          const drawer = page.locator('[id^="doc-drawer_media_"]').last()
          await drawer
            .locator('input[type="file"]')
            .setInputFiles(fileURLToPath(new URL('../uploads/test-image.png', import.meta.url)))
          const filename = drawer.getByRole('textbox', { name: 'File Name', exact: true })
          await expect(filename).toHaveValue('test-image.png')
          await expect(drawer.locator('.drawer__fade-in')).toHaveCSS('opacity', '1')
          await page.mouse.move(0, 0)
          await expectPaintContrast({
            againstParent: true,
            minimum: 3,
            property: 'borderTopColor',
            targets: filename,
          })
          await filename.hover()
          await expectPaintContrast({
            againstParent: true,
            minimum: 3,
            property: 'borderTopColor',
            targets: filename,
          })
        },
        serverURL,
        themes: ['light', 'dark'],
      })
    })

    test('should provide enhanced contrast for the column search boundary', async () => {
      await inContrastThemes({
        page,
        run: async () => {
          await gotoPostsList({ page, postsURL })
          const { columnContainer } = await openListColumns(page, {})
          await expectPaintContrast({
            againstParent: true,
            minimum: 3,
            property: 'backgroundColor',
            targets: columnContainer.locator('.column-selector__search-bar'),
          })
        },
        serverURL,
        themes: ['light', 'dark'],
      })
    })

    test('should provide enhanced contrast for editable block title boundaries', async () => {
      await inContrastThemes({
        page,
        run: async () => {
          await addTextBlock({ page, postsURL })
          const title = page.locator('.blocks-field__row .section-title__input')
          await page.mouse.move(0, 0)
          await expectPaintContrast({
            againstParent: true,
            minimum: 3,
            property: 'borderTopColor',
            targets: title,
          })
          await title.hover()
          await expectPaintContrast({
            againstParent: true,
            minimum: 3,
            property: 'borderTopColor',
            targets: title,
          })
        },
        serverURL,
        themes: ['light', 'dark'],
      })
    })

    test('should provide enhanced contrast for the rich-text editor boundary', async () => {
      await inContrastThemes({
        page,
        run: async () => {
          await gotoCreatePost({ page, postsURL })
          await expectPaintContrast({
            againstParent: true,
            minimum: 3,
            property: 'borderTopColor',
            targets: page.locator('.rich-text-lexical .editor-container'),
          })
        },
        serverURL,
        themes: ['light', 'dark'],
      })
    })

    test('should provide contrast for an off column switch', async () => {
      // PYLD-3759
      await inContrastThemes({
        page,
        run: async () => {
          await gotoPostsList({ page, postsURL })
          const { columnContainer } = await openListColumns(page, {})
          const row = columnContainer.locator('.column-selector__item--inactive').first()
          await expect(row.locator('input')).not.toBeChecked()
          await expectPaintContrast({
            againstParent: true,
            minimum: 3,
            property: 'backgroundColor',
            targets: row.locator('.switch__track'),
          })
          await expectPaintContrast({
            againstParent: true,
            minimum: 3,
            property: 'backgroundColor',
            targets: row.locator('.switch__knob'),
          })
        },
        serverURL,
        themes: ['light', 'dark'],
      })
    })

    test('should provide contrast for enabled pagination controls', async () => {
      // PYLD-3763
      await inContrastThemes({
        page,
        run: async () => {
          await page.goto(`${postsURL.list}?limit=1`)
          const next = page.locator('.clickable-arrow--right')
          await expect(next).toBeEnabled()
          await expectPaintContrast({
            minimum: 3,
            property: 'fill',
            targets: next.locator('svg path'),
          })
          const pageInput = page.getByRole('textbox', { name: 'Go to page', exact: true })

          await expect(pageInput).toBeEnabled()
          await expectPaintContrast({
            againstParent: true,
            minimum: 3,
            property: 'backgroundColor',
            targets: pageInput,
          })
          await pageInput.focus()
          await expect(pageInput).toBeFocused()
          await expectPaintContrast({
            againstParent: true,
            minimum: 3,
            property: 'backgroundColor',
            targets: pageInput,
          })
          await next.click()
          await expect(pageInput).toHaveValue('2')
          const previous = page.locator('.clickable-arrow--left')

          await expect(previous).toBeEnabled()
          await expectPaintContrast({
            minimum: 3,
            property: 'fill',
            targets: previous.locator('svg path'),
          })
          await page.goto(`${postsURL.list}?limit=10`)
        },
        serverURL,
        themes: ['light', 'dark'],
      })
    })

    test('should provide contrast for unchecked table checkbox boundaries', async () => {
      // PYLD-3764
      await inContrastThemes({
        page,
        run: async () => {
          await gotoPostsList({ page, postsURL })
          await expect(page.locator('tbody tr .cell-_select input').first()).not.toBeChecked()
          await expectPaintContrast({
            againstParent: true,
            minimum: 3,
            property: 'backgroundColor',
            targets: page.locator('tbody tr .cell-_select .checkbox-input__input'),
          })
        },
        serverURL,
        themes: ['light', 'dark'],
      })
    })

    test('should provide contrast for table sort arrows', async () => {
      // PYLD-3765
      await inContrastThemes({
        page,
        run: async () => {
          await gotoPostsList({ page, postsURL })
          await page.mouse.move(0, 0)
          await expectPaintContrast({
            minimum: 3,
            property: 'fill',
            targets: page.locator('.sort-column__button svg path'),
          })
        },
        serverURL,
        themes: ['light', 'dark'],
      })
    })
  })

  test.describe('2.1.1 Keyboard (A)', () => {
    test('should move the focal-point handle with arrow keys and clamp it to the image', async () => {
      const dialog = await openEditImageDialog({ page, serverURL })
      const handle = dialog.getByRole('button', { name: 'Set focal point', exact: true })
      const x = dialog.getByRole('spinbutton', { name: 'Focal Point X', exact: true })
      const y = dialog.getByRole('spinbutton', { name: 'Focal Point Y', exact: true })

      await handle.focus()
      await handle.press('ArrowRight')
      await expect(x).toHaveValue('51')
      await handle.press('ArrowDown')
      await expect(y).toHaveValue('51')
      await handle.press('ArrowLeft')
      await handle.press('ArrowUp')
      await expect(x).toHaveValue('50')
      await expect(y).toHaveValue('50')
      await expect(handle).toBeFocused()

      await x.fill('99')
      await y.fill('1')
      await handle.focus()
      await handle.press('Shift+ArrowRight')
      await handle.press('Shift+ArrowUp')
      await expect(x).toHaveValue('100')
      await expect(y).toHaveValue('0')
      await handle.press('ArrowRight')
      await handle.press('ArrowUp')
      await expect(x).toHaveValue('100')
      await expect(y).toHaveValue('0')
      await handle.press('Shift+ArrowLeft')
      await handle.press('Shift+ArrowDown')
      await expect(x).toHaveValue('90')
      await expect(y).toHaveValue('10')
      await expect(handle).toBeFocused()
      await handle.press('Tab')
      await expect(handle).not.toBeFocused()
    })

    test('should reorder rich-text callouts using the keyboard on the page and creation panel', async () => {
      // PYLD-3666
      test.setTimeout(60000)
      for (const context of ['page', 'relationship panel'] as const) {
        await test.step(context, async () => {
          const container = await openRichTextContext({
            isDrawer: context === 'relationship panel',
            page,
            postsURL,
          })
          const callouts = getCallouts({ container })

          await expect(callouts).toHaveCount(2)
          const handle = callouts.first().getByRole('button', { name: /drag to reorder/i })

          const paragraph = container.locator('[contenteditable="true"] > p').last()

          await paragraph.click()
          await page.keyboard.press('Tab')
          await expect(paragraph).toHaveCSS('padding-inline-start', '40px')
          await page.keyboard.press('Shift+Tab')
          await expect(paragraph).toHaveCSS('padding-inline-start', '0px')
          await callouts.first().locator('.collapsible__toggle').focus()
          await page.keyboard.press('Tab')
          await expect(handle).toBeFocused()
          await page.keyboard.press('Shift+Tab')
          await expect(callouts.first().locator('.collapsible__toggle')).toBeFocused()
          await page.keyboard.press('Tab')
          await expect(handle).toBeFocused()
          const initialTop = (await callouts.first().boundingBox())!.y

          await page.keyboard.press('Space')
          await page.keyboard.press('ArrowDown')
          await expect
            .poll(async () => (await callouts.first().boundingBox())!.y)
            .toBeGreaterThan(initialTop)
          await expect(handle).toBeFocused()
          await page.keyboard.press('Space')
          await expect
            .soft(callouts.first().locator('input[value$="callout"]'))
            .toHaveValue('Second callout')
          await expect
            .soft(callouts.nth(1).locator('input[value$="callout"]'))
            .toHaveValue('First callout')
          await expect(paragraph).toHaveText('')
          await expect(paragraph).toHaveCSS('padding-inline-start', '0px')
          if (context === 'page') {
            await callouts
              .nth(1)
              .getByRole('button', { name: /drag to reorder/i })
              .focus()
            const modifier = await page.evaluate(() =>
              navigator.userAgent.includes('Mac OS X') ? 'Meta' : 'Control',
            )

            await page.keyboard.press(`${modifier}+k`)
            await expect(page.locator('#command-palette')).toBeVisible()
            await page.keyboard.press('Escape')
          }
        })
      }
    })

    test('should move rich-text lines with keyboard shortcuts in both editor contexts', async () => {
      // Additional coverage for PYLD-3666 beyond block-object handles.
      for (const isDrawer of [false, true]) {
        const container = await openRichTextContext({ isDrawer, page, postsURL })
        const editor = container.locator('[contenteditable="true"]').first()

        await editor.locator('p').last().click()
        await page.keyboard.insertText('First line')
        await page.keyboard.press('Enter')
        await page.keyboard.insertText('Second line')
        await page.keyboard.press('Alt+Shift+ArrowUp')
        await expect(editor.locator('p')).toHaveText(['Second line', 'First line'])
        await page.keyboard.press('Alt+Shift+ArrowDown')
        await expect(editor.locator('p')).toHaveText(['First line', 'Second line'])
      }
    })

    test('should cancel block reordering and retain focus at the first boundary', async () => {
      // Additional coverage for PYLD-3666.
      const drawer = await openRelationshipCreationDrawer({ page, postsURL })
      const callouts = getCallouts({ container: drawer })
      let handle = callouts.first().getByRole('button', { name: /drag to reorder/i })

      await handle.focus()
      const initialTop = (await callouts.first().boundingBox())!.y

      await handle.press('Space')
      await page.keyboard.press('ArrowDown')
      await expect
        .poll(async () => (await callouts.first().boundingBox())!.y)
        .toBeGreaterThan(initialTop)
      await page.keyboard.press('ArrowUp')
      await expect.poll(async () => (await callouts.first().boundingBox())!.y).toBe(initialTop)
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('Escape')
      await expect.poll(async () => (await callouts.first().boundingBox())!.y).toBe(initialTop)
      await expect(drawer).toBeVisible()
      await expect(callouts.first().locator('input[value$="callout"]')).toHaveValue('First callout')
      await expect(handle).toBeFocused()
      await handle.press('Space')
      await page.keyboard.press('ArrowUp')
      await page.keyboard.press('Space')
      handle = callouts.first().getByRole('button', { name: /drag to reorder/i })
      await expect(handle).toBeFocused()
      await expect(callouts.first().locator('input[value$="callout"]')).toHaveValue('First callout')
    })

    test('should expose reorder feedback when a callout is collapsed', async () => {
      // Additional coverage for PYLD-3666 and 4.1.3 Status Messages (AA).
      await gotoCreatePost({ page, postsURL })
      const callout = page.locator('.rich-text-lexical .collapsible').first()
      await callout.getByRole('button', { name: 'Collapse', exact: true }).click()
      const handle = callout.getByRole('button', { name: /drag to reorder/i })

      await handle.focus()
      await handle.press('Space')
      await handle.press('ArrowDown')
      await expect(callout.getByRole('status')).toHaveText(/Order: 2/)
      await handle.press('Escape')
    })

    test('should operate callout menus and collapse controls with a pointer', async () => {
      // Additional coverage for PYLD-3666 and 2.5.7 Dragging Movements (AA).
      await gotoCreatePost({ page, postsURL })
      const callouts = getCallouts({ container: page.locator('main') })

      await callouts.first().locator('.section-title__input').fill('Edited block')
      const handle = callouts.first().getByRole('button', { name: /drag to reorder/i })

      await handle.focus()
      await handle.press('Space')
      await handle.press('ArrowDown')
      const collapse = callouts.first().getByRole('button', { name: 'Collapse', exact: true })
      const background = await collapse.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      )

      await collapse.hover()
      await expect(collapse).not.toHaveCSS('background-color', background)
      await collapse.click({ delay: 150 })
      await expect(callouts.first().locator('input[value="First callout"]')).toBeHidden()
      await callouts
        .first()
        .getByRole('button', { name: 'Expand', exact: true })
        .click({ delay: 150 })
      await expect(callouts.first().locator('input[value="First callout"]')).toBeVisible()
      await handle.focus()
      await handle.press('Space')
      await handle.press('ArrowDown')
      await callouts
        .first()
        .locator('.collapsible__actions .popup__trigger-wrap button')
        .click({ delay: 150 })
      await page.getByRole('menuitem', { name: 'Move Down', exact: true }).click({ delay: 150 })
      await expect(callouts.first().locator('input[value$="callout"]')).toHaveValue(
        'Second callout',
      )
      await callouts
        .nth(1)
        .locator('.collapsible__actions .popup__trigger-wrap button')
        .click({ delay: 150 })
      await page.getByRole('menuitem', { name: 'Move Up', exact: true }).click({ delay: 150 })
      await expect(callouts.first().locator('input[value$="callout"]')).toHaveValue('First callout')
      await callouts
        .first()
        .locator('.collapsible__actions .popup__trigger-wrap button')
        .click({ delay: 150 })
      await page.getByRole('menuitem', { name: 'Remove', exact: true }).click({ delay: 150 })
      await expect(callouts).toHaveCount(1)
      await expect(callouts.first().locator('input[value$="callout"]')).toHaveValue(
        'Second callout',
      )
    })

    test('should operate the Copy to locale select with the keyboard', async () => {
      // PYLD-3688
      const drawer = await openCopyToLocaleDrawer({ page, postsURL, serverURL })
      const combobox = drawer.locator('#field-toLocale input[role="combobox"]')

      await combobox.focus()
      await combobox.press('ArrowDown')
      const activeOption = page.locator('.rs__option').first()
      await expect(activeOption).toHaveClass(/rs__option--is-focused/)
      await combobox.press('Enter')
      await expect(drawer.locator('#field-toLocale .rs__single-value')).not.toBeEmpty()
    })

    test('should not activate or close disabled row-menu actions', async () => {
      // Additional coverage for PYLD-3743 and PYLD-3745; canonical ticket coverage is in screen-reader.spec.ts.
      const menu = await openFirstBlockActions({ page, postsURL })
      const disabledAction = menu.getByRole('menuitem', { name: /replace row/i })
      const blockRows = page.locator('#field-layout .blocks-field__row')
      const initialBlockRowCount = await blockRows.count()

      await expect(disabledAction).toHaveAttribute('aria-disabled', 'true')
      for (const activate of [
        () => disabledAction.click({ force: true }),
        async () => {
          await disabledAction.focus()
          await disabledAction.press('Enter')
        },
        async () => {
          await disabledAction.focus()
          await disabledAction.press('Space')
        },
      ]) {
        await activate()
        await expect(blockRows).toHaveCount(initialBlockRowCount)
        await expect(menu).toBeVisible()
      }
    })

    test('should expose only one menu item at a time in the tab order', async () => {
      // Additional coverage for PYLD-3745.
      const menu = await openFirstBlockActions({ page, postsURL })
      const menuItems = menu.getByRole('menuitem')
      const tabIndexes = await menuItems.evaluateAll((items) => items.map((item) => item.tabIndex))

      expect(tabIndexes.filter((tabIndex) => tabIndex === 0)).toHaveLength(1)
      expect(tabIndexes.filter((tabIndex) => tabIndex === -1)).toHaveLength(tabIndexes.length - 1)
    })

    test('should position a popup against its trigger inside a transformed drawer', async () => {
      // Additional coverage for PYLD-3697 and PYLD-3701.
      const drawer = await openRichTextRelationshipDrawer({ page, postsURL })
      await drawer.evaluate((element) => {
        element.style.transform = 'translateX(-40px)'
      })
      const trigger = drawer.locator('.per-page .popup__trigger-wrap button')

      await trigger.click()
      const popup = drawer.locator('.per-page .popup__content')
      const [triggerBox, popupBox] = await Promise.all([trigger.boundingBox(), popup.boundingBox()])

      expect(triggerBox).not.toBeNull()
      expect(popupBox).not.toBeNull()
      const triggerRight = triggerBox!.x + triggerBox!.width
      const popupRight = popupBox!.x + popupBox!.width
      const verticalGap = Math.min(
        Math.abs(popupBox!.y - (triggerBox!.y + triggerBox!.height)),
        Math.abs(triggerBox!.y - (popupBox!.y + popupBox!.height)),
      )

      expect(Math.abs(popupRight - triggerRight)).toBeLessThanOrEqual(1)
      expect(verticalGap).toBeLessThanOrEqual(8)
      await expect(drawer).not.toHaveCSS('transform', 'none')
      await expect(popup).toHaveCSS('position', 'fixed')
    })

    test('should keep an oversized popup within the viewport', async () => {
      // Additional coverage for PYLD-3697 and PYLD-3701.
      try {
        await page.setViewportSize({ height: 180, width: 320 })
        await page.goto(`${serverURL}/admin`)
        await page.locator('.user-menu__trigger').click()
        const popup = page.locator('.user-menu > .popup__content')
        const popupBox = await popup.boundingBox()

        expect(popupBox).not.toBeNull()
        expect(popupBox!.x).toBeGreaterThanOrEqual(0)
        expect(popupBox!.y).toBeGreaterThanOrEqual(0)
        expect(popupBox!.x + popupBox!.width).toBeLessThanOrEqual(320)
        expect(popupBox!.y + popupBox!.height).toBeLessThanOrEqual(180)
      } finally {
        await page.setViewportSize({ height: 720, width: 1280 })
      }
    })

    test('should keep a side submenu within the viewport', async () => {
      // Additional coverage for PYLD-3697 and PYLD-3701.
      try {
        await page.setViewportSize({ height: 720, width: 800 })
        await page.goto(`${serverURL}/admin`)
        await page.locator('.user-menu__trigger').click()
        await page.getByRole('menuitem', { name: /theme/i }).click()
        const submenu = page.locator('.user-menu .popup__content').last()
        const submenuBox = await submenu.boundingBox()

        expect(submenuBox).not.toBeNull()
        expect(submenuBox!.x).toBeGreaterThanOrEqual(0)
        expect(submenuBox!.x + submenuBox!.width).toBeLessThanOrEqual(800)
      } finally {
        await page.setViewportSize({ height: 720, width: 1280 })
      }
    })

    test('should keep a rich-text dropdown attached while its container scrolls', async () => {
      // Additional coverage for PYLD-3679.
      await gotoCreatePost({ page, postsURL })
      const trigger = page.locator('.rich-text-lexical .toolbar-popup__dropdown-add')

      await trigger.scrollIntoViewIfNeeded()
      await trigger.click()
      const menu = page.locator('.toolbar-popup__dropdown-items[data-dropdown-key="add"]')
      const beforeTriggerBox = await trigger.boundingBox()
      const beforeMenuBox = await menu.boundingBox()

      expect(beforeTriggerBox).not.toBeNull()
      expect(beforeMenuBox).not.toBeNull()
      const didMove = await trigger.evaluate((element) => {
        const richText = element.closest<HTMLElement>('.rich-text-lexical')
        if (richText) {
          richText.style.transform = 'translateY(-40px)'
          window.dispatchEvent(new Event('scroll'))
        }
        return Boolean(richText)
      })

      expect(didMove).toBe(true)
      await expect
        .poll(async () => {
          const [triggerBox, menuBox] = await Promise.all([
            trigger.boundingBox(),
            menu.boundingBox(),
          ])
          return Math.abs(menuBox!.y - (triggerBox!.y + triggerBox!.height))
        })
        .toBeLessThanOrEqual(6)
    })

    test('should keep a rich-text dropdown within the bottom viewport edge', async () => {
      // Additional coverage for PYLD-3679.
      await gotoCreatePost({ page, postsURL })
      const trigger = page.locator('.rich-text-lexical .toolbar-popup__dropdown-add')

      await trigger.scrollIntoViewIfNeeded()
      await trigger.evaluate((element) => {
        const richText = element.closest<HTMLElement>('.rich-text-lexical')
        if (richText) {
          const triggerBottom = element.getBoundingClientRect().bottom
          richText.style.transform = `translateY(${window.innerHeight - triggerBottom - 4}px)`
        }
      })
      await trigger.click()
      const menu = page.locator('.toolbar-popup__dropdown-items[data-dropdown-key="add"]')
      const menuBox = await menu.boundingBox()

      expect(menuBox).not.toBeNull()
      expect(menuBox!.y).toBeGreaterThanOrEqual(0)
      expect(menuBox!.y + menuBox!.height).toBeLessThanOrEqual(720)
    })

    test('should remove a selected value with Space', async () => {
      // Additional coverage for PYLD-3768.
      await gotoCreatePost({ page, postsURL })
      const select = page.locator('#field-accessibilitySortableSelect')
      const removeButton = select.locator('.multi-value-remove').first()

      await expect(select.locator('.rs__multi-value')).toHaveCount(2)
      await removeButton.focus()
      await page.keyboard.press('Space')

      await expect(select.locator('.rs__multi-value')).toHaveCount(1)
      await expect(page.locator('.rs__menu')).toBeHidden()
    })

    test('should clear a select value with Space', async () => {
      // Additional coverage for PYLD-3755.
      await gotoCreatePost({ page, postsURL })
      const select = page.locator('#field-accessibilitySelect')
      const clearButton = select.locator('.clear-indicator')

      await expect(select.locator('.rs__single-value')).toContainText('Value One')
      await clearButton.focus()
      await page.keyboard.press('Space')

      await expect(select.locator('.rs__single-value')).toHaveCount(0)
      await expect(page.locator('.rs__menu')).toBeHidden()
    })
  })

  test.describe('2.1.4 Character Key Shortcuts (A)', () => {
    test('should close only the top popup when Escape is pressed in a rich-text flyout', async () => {
      // PYLD-3661
      const drawer = await openRichTextRelationshipDrawer({ page, postsURL })
      const { groupByContent: groupByPopup } = await openGroupBy(page)

      await groupByPopup.locator('.group-by-control__select-trigger').first().click()
      const nestedOption = page.locator('.popup__content').last().getByRole('menuitemradio').first()
      await expect(nestedOption).toBeVisible()
      await nestedOption.focus()
      await page.keyboard.press('Escape')

      await expect(drawer).toBeVisible()
      await expect(groupByPopup).toBeVisible()
      await expect(nestedOption).toBeHidden()
    })
  })

  test.describe('2.4.3 Focus Order (A)', () => {
    for (const key of ['Enter', 'Space']) {
      test(`should retain focus after moving a rich-text block without a drag handle using ${key}`, async () => {
        await gotoCreatePost({ page, postsURL })
        await page.locator('[contenteditable="true"]').first().locator('p').last().click()
        await page.keyboard.type('/nohandle')
        await page
          .locator('#slash-menu')
          .getByRole('option', { name: /no handle block/i })
          .click()
        const block = page.locator('.LexicalEditorTheme__block-noHandle')
        const trigger = block.locator('.LexicalEditorTheme__block__actions-button')

        const header = block.locator('.collapsible__toggle-wrap').first()
        const nestedHandle = block.locator('.collapsible__drag')

        await expect(header.locator('.collapsible__drag')).toHaveCount(0)
        await expect(nestedHandle).toBeVisible()
        await expect(block.locator('.LexicalEditorTheme__block__block-number')).toHaveText('03')
        const paragraphs = page.locator('[contenteditable="true"]').first().locator(':scope > p')
        const paragraphCount = await paragraphs.count()

        await trigger.press(key)
        await page.getByRole('menuitem', { name: 'Move Up', exact: true }).press(key)
        await expect(block.locator('.LexicalEditorTheme__block__block-number')).toHaveText('02')
        await expect(trigger).toBeFocused()
        await header.getByRole('button', { name: 'Collapse', exact: true }).click()
        await expect(nestedHandle).toBeHidden()
        await trigger.press(key)
        await page.getByRole('menuitem', { name: 'Move Down', exact: true }).press(key)
        await expect(block.locator('.LexicalEditorTheme__block__block-number')).toHaveText('03')
        await expect(trigger).toBeFocused()
        await expect(paragraphs).toHaveCount(paragraphCount)
        await page.keyboard.press(key)
        await page.getByRole('menuitem', { name: 'Remove', exact: true }).press(key)
        await expect(block).toHaveCount(0)
        await expect(paragraphs).toHaveCount(paragraphCount)
      })
    }

    test('should focus and isolate nested modals with custom IDs', async () => {
      await page.goto(
        formatAdminURL({ adminRoute: '/admin', path: '/custom-modal-ids', serverURL }),
      )
      await page.getByRole('button', { name: 'Open parent' }).click()
      await expect(page.getByRole('dialog', { name: 'Parent title' })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Parent title' })).toBeFocused()
      await page.getByRole('button', { name: 'Open child' }).click()
      await expect(page.getByRole('dialog', { name: 'Child title' })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Child title' })).toBeFocused()
      await expect(page.getByTestId('parent')).toHaveAttribute('inert', '')
      await expect(page.getByTestId('child')).not.toHaveAttribute('inert')
      await page.getByRole('button', { name: 'Close child' }).click()
      await expect(page.getByTestId('parent')).not.toHaveAttribute('inert')
      await expect(page.getByRole('button', { name: 'Open child' })).toBeFocused()
      await page.getByRole('button', { name: 'Close parent' }).click()
      await expect(page.getByRole('button', { name: 'Open parent' })).toBeFocused()
    })

    test('should contain keyboard focus in media and nested folder modals', async () => {
      // Additional coverage for PYLD-3575 and PYLD-3587; browse-cursor coverage is in screen-reader.spec.ts.
      test.setTimeout(60000)
      for (const open of [openBulkUploadDialog, openEditImageDialog, openFolderCreationLocation]) {
        const modal = await open({ page, serverURL })
        const firstButton = modal.getByRole('button').first()

        await firstButton.focus()
        const stopCount = await modal.locator('button, input, a[href], [tabindex="0"]').count()

        for (const key of ['Tab', 'Shift+Tab']) {
          for (let step = 0; step < stopCount + 2; step++) {
            await page.keyboard.press(key)
            expect
              .soft(await modal.evaluate((element) => element.contains(document.activeElement)))
              .toBe(true)
          }
        }
      }
    })

    test('should isolate modal content and restore focus after nested dismissal', async () => {
      // Additional coverage for PYLD-3575, PYLD-3587, PYLD-3644 and PYLD-3682.
      const { drawer, trigger } = await openWidgetDrawer({ page, serverURL })

      await trigger.press('Enter')
      await expect(drawer).toBeVisible()
      await expect(page.getByRole('main')).toHaveCount(0)
      await expect(drawer).toHaveAccessibleName(/add widget/i)
      await page.keyboard.press('Escape')
      await expect(drawer).not.toBeVisible()
      await expect(trigger).toBeFocused()
      await expect(page.getByRole('navigation').first()).toBeVisible()

      const modal = await openFolderCreationLocation({ page, serverURL })
      const parent = page.locator('dialog.drawer[open]')

      await expect(parent.getByRole('textbox')).toHaveCount(0)
      await page.keyboard.press('Escape')
      await expect(modal).not.toBeVisible()
      await expect(parent).toBeVisible()
      await expect
        .poll(() => parent.evaluate((element) => element.contains(document.activeElement)))
        .toBe(true)
      await expect(parent.getByRole('textbox').first()).toBeVisible()
    })

    test('should keep drawer filter options inside the active modal accessibility tree', async () => {
      // Additional coverage for PYLD-3662; synthesized speech still needs NVDA.
      const drawer = await openRichTextUploadDrawer({ page, postsURL })
      const controls = await openDrawerFilters({ drawer })

      await controls.nth(0).click()
      await expect(drawer.getByRole('option').first()).toBeVisible()
      await expect(page.getByRole('main')).toHaveCount(0)
    })

    test('should keep table actions and resize handles operable inside a creation drawer', async () => {
      // Additional coverage for portals owned by the active modal.
      const drawer = await openRelationshipCreationDrawer({ page, postsURL })
      await drawer.locator('[contenteditable="true"] p').last().click()
      await drawer.locator('.toolbar-popup__dropdown-add').click()
      await drawer.locator('.toolbar-popup__dropdown-item[data-item-key="table"]').click()
      await drawer.getByRole('button', { name: '2 columns, 2 rows', exact: true }).click()
      const table = drawer.locator('[contenteditable="true"] table')
      await expect(table.locator('tr')).toHaveCount(2)
      const cell = table.locator('th, td').first()
      await cell.click()
      await cell.hover()
      await expect(drawer.locator('.TableCellResizer__ui')).toHaveCount(2)
      const width = (await cell.boundingBox())?.width ?? 0
      const resize = await drawer.locator('.TableCellResizer__ui').first().boundingBox()

      if (!resize) {
        throw new Error('Expected a visible table resize handle')
      }
      await page.mouse.move(resize.x + resize.width / 2, resize.y + resize.height / 2)
      await page.mouse.down()
      await page.mouse.move(resize.x + resize.width / 2 + 40, resize.y + resize.height / 2, {
        steps: 5,
      })
      await page.mouse.up()
      await expect
        .poll(async () => (await cell.boundingBox())?.width ?? 0)
        .toBeGreaterThan(width + 20)
      await cell.click()
      await drawer.locator('.table-cell-action-button').click()
      await drawer.locator('[data-test-id="table-insert-row-below"]').click()
      await expect(table.locator('tr')).toHaveCount(3)
    })

    test('should keep calendar controls operable inside a creation drawer', async () => {
      // Additional coverage for modal isolation and nested popovers.
      const drawer = await openRelationshipCreationDrawer({ page, postsURL })
      await drawer.locator('#field-publishedOn input').click()
      const calendar = drawer.locator('.react-datepicker')

      await expect(calendar).toBeVisible()
      await calendar.getByRole('combobox', { name: /month/i }).selectOption('0')
      await expect(calendar.getByRole('combobox', { name: /month/i })).toHaveValue('0')
      await calendar
        .locator('.react-datepicker__day:not(.react-datepicker__day--outside-month)')
        .first()
        .click()
      await expect(drawer.locator('#field-publishedOn input')).not.toHaveValue('')
    })

    test('should move focus into rich-text insertion and relationship creation panels', async () => {
      // PYLD-3676
      test.setTimeout(60000)
      for (const open of [
        openRichTextUploadDrawer,
        openRichTextRelationshipDrawer,
        openRelationshipCreationDrawer,
      ]) {
        const drawer = await open({ page, postsURL })

        await expect.soft
          .poll(() => drawer.evaluate((element) => element.contains(document.activeElement)))
          .toBe(true)
      }
    })

    test('should keep active link editing available on the page and in a drawer', async () => {
      // Additional coverage for PYLD-3665.
      for (const isDrawer of [false, true]) {
        const container = await openRichTextContext({ isDrawer, page, postsURL })
        const editor = container.locator('[contenteditable="true"]').first()

        await editor.locator('p').last().click()
        await page.keyboard.insertText('https://example.com')
        await page.keyboard.press('Space')
        await page.keyboard.press('ArrowLeft')
        await page.keyboard.press('ArrowLeft')
        const edit = container.getByRole('button', { name: 'Edit link', exact: true })

        await expect(edit).toBeVisible()
        await edit.focus()
        await edit.press('Enter')
        const linkDrawer = page.locator('dialog.lexical-link-edit-drawer')
        await expect(linkDrawer).toBeVisible()
        await expect(linkDrawer.locator('#field-url')).toHaveValue('https://example.com')
      }
    })

    test('should keep inactive link controls out of keyboard navigation on the page and creation panel', async () => {
      // PYLD-3665
      test.setTimeout(60000)
      for (const isDrawer of [false, true]) {
        const container = await openRichTextContext({ isDrawer, page, postsURL })
        const editor = container.locator('[contenteditable="true"]').first()

        await editor.locator('p').last().click()
        await page.keyboard.insertText('Plain text without a link')
        for (let step = 0; step < 12; step++) {
          await page.keyboard.press('Tab')
          const focus = page.locator(':focus')

          await expect.soft(focus).not.toHaveAccessibleName(/^(edit|remove) link$/i)
        }
        const controls = container.locator('.link-edit, .link-trash')

        for (const control of await controls.all()) {
          const canReceiveTab = await control.evaluate((element) => {
            const node = element as HTMLElement
            return (
              node.tabIndex >= 0 &&
              node.getClientRects().length > 0 &&
              !node.closest('[inert]') &&
              getComputedStyle(node).visibility !== 'hidden'
            )
          })

          expect
            .soft(canReceiveTab, 'Inactive floating link controls must not receive Tab')
            .toBe(false)
        }
      }
    })

    test('should navigate User menu items without entering hidden submenus', async () => {
      // Additional coverage for PYLD-3645 and PYLD-3697.
      await page.goto(`${serverURL}/admin`)
      const trigger = page.locator('.user-menu__trigger')

      await trigger.focus()
      await trigger.press('Enter')

      const account = page.getByRole('menuitem', { name: /dev@payloadcms\.com/i })
      const theme = page.getByRole('menuitem', { name: /theme/i })
      const language = page.getByRole('menuitem', { name: /language/i })
      const logout = page.getByRole('menuitem', { name: /log out/i })

      await expect(account).toBeFocused()
      await page.keyboard.press('ArrowDown')
      await expect(theme).toBeFocused()
      await page.keyboard.press('ArrowDown')
      await expect(language).toBeFocused()
      await page.keyboard.press('ArrowDown')
      await expect(logout).toBeFocused()

      await language.focus()
      await language.press('Enter')
      const languageOption = page.getByRole('menuitemradio').first()
      await expect(languageOption).toBeFocused()
      await languageOption.press('Escape')
      await expect(language).toBeFocused()
    })

    test('should close the full User menu chain when tabbing from a nested menu', async () => {
      // Additional coverage for PYLD-3645 and PYLD-3697.
      await page.goto(`${serverURL}/admin`)
      const trigger = page.locator('.user-menu__trigger')

      await trigger.focus()
      await trigger.press('Enter')
      const language = page.getByRole('menuitem', { name: /language/i })
      await language.focus()
      await language.press('Enter')
      const languageOption = page.getByRole('menuitemradio').first()
      await expect(languageOption).toBeFocused()

      await page.keyboard.press('Tab')

      await expect(languageOption).toBeHidden()
      await expect(language).toBeHidden()
      await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    })

    test('should restore visible focus when shift-tabbing from a nested User menu', async () => {
      // Additional coverage for PYLD-3645 and PYLD-3697.
      await page.goto(`${serverURL}/admin`)
      const trigger = page.locator('.user-menu__trigger')

      await trigger.focus()
      await trigger.press('Enter')
      const language = page.getByRole('menuitem', { name: /language/i })
      await language.focus()
      await language.press('Enter')
      const languageOption = page.getByRole('menuitemradio').first()
      await expect(languageOption).toBeFocused()

      await page.keyboard.press('Shift+Tab')

      await expect(languageOption).toBeHidden()
      await expect(language).toBeHidden()
      await expect(trigger).toBeFocused()
      await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    })

    test('should move focus into a mobile User menu submenu', async () => {
      // Additional coverage for PYLD-3645 and PYLD-3697.
      await page.setViewportSize({ height: 720, width: 320 })
      await page.goto(`${serverURL}/admin`)
      const trigger = page.locator('.user-menu__trigger')

      await trigger.focus()
      await trigger.press('Enter')
      const language = page.getByRole('menuitem', { name: /language/i })
      await expect(language).not.toHaveAttribute('aria-haspopup')
      await language.focus()
      await language.press('Enter')

      const back = page.getByRole('menuitem', { name: 'Language', exact: true })
      await expect(back).toBeFocused()
      await page.keyboard.press('ArrowDown')
      await expect(page.getByRole('menuitemradio').first()).toBeFocused()
      await page.setViewportSize({ height: 720, width: 1280 })
    })

    test('should move keyboard focus into and through the Group by dialog', async () => {
      // Additional coverage for PYLD-3782 and PYLD-3783.
      await gotoPostsList({ page, postsURL })
      const trigger = page.locator('#toggle-group-by')

      await trigger.focus()
      await trigger.press('Enter')

      const dialog = page.getByRole('dialog', { name: /group by/i })
      const close = dialog.getByRole('button', { name: /close/i })
      const field = dialog.getByRole('button', { name: /field/i })

      await expect(close).toBeFocused()
      await page.keyboard.press('Tab')
      await expect(field).toBeFocused()
      await expect(dialog).toBeVisible()
    })

    test('should move keyboard focus into and through the Columns dialog', async () => {
      // Additional coverage for PYLD-3701.
      await gotoPostsList({ page, postsURL })
      const trigger = page.locator('.columns-button__button')

      await trigger.focus()
      await trigger.press('Enter')

      const dialog = page.getByRole('dialog', { name: /columns/i })
      const close = dialog.getByRole('button', { name: /close/i })
      const search = dialog.getByRole('textbox', { name: /search columns/i })

      await expect(close).toBeFocused()
      await page.keyboard.press('Tab')
      await expect(search).toBeFocused()
      await expect(dialog).toBeVisible()
    })

    test('should place a dashboard popup immediately after its trigger in the DOM', async () => {
      // PYLD-3639
      await page.goto(`${serverURL}/admin`)
      const trigger = page.locator('.dashboard-breadcrumb-dropdown .popup__trigger-wrap button')
      await trigger.click()
      const popup = page.locator('.popup__content').last()

      await expect(popup).toBeVisible()
      expect(
        await trigger.evaluate(
          (element, popupElement) =>
            element.closest('.popup')?.querySelector(':scope > .popup__content') === popupElement,
          await popup.elementHandle(),
        ),
      ).toBe(true)
    })

    test('should move keyboard focus into dropdowns in rich-text relationship flyouts', async () => {
      // PYLD-3664
      await openRichTextRelationshipDrawer({ page, postsURL })
      const { groupByContent: groupByPopup } = await openGroupBy(page)
      const fieldTrigger = groupByPopup.locator('.group-by-control__select-trigger').first()

      await fieldTrigger.focus()
      await fieldTrigger.press('Enter')
      await expect(page.locator('.popup__content').last().locator('button').first()).toBeFocused()
    })

    test('should leave a rich-text toolbar dropdown in normal Tab order', async () => {
      // Additional coverage for PYLD-3664 and PYLD-3679.
      await gotoCreatePost({ page, postsURL })
      const trigger = page.locator('.rich-text-lexical .toolbar-popup__dropdown-add')

      await trigger.focus()
      await trigger.press('Enter')
      const menu = page.locator('.toolbar-popup__dropdown-items[data-dropdown-key="add"]')
      const menuItem = menu.locator('[role^="menuitem"]').first()
      await expect(menuItem).toBeFocused()
      await expect(menuItem).toHaveAttribute('tabindex', '-1')
      await page.keyboard.press('Tab')

      await expect(menu).toBeHidden()
      await expect(trigger).not.toBeFocused()
    })

    test('should place rich-text dropdown content next to its trigger in logical DOM order', async () => {
      // PYLD-3679
      await gotoCreatePost({ page, postsURL })
      const trigger = page.locator('.rich-text-lexical .toolbar-popup__dropdown-add')
      await trigger.click()
      const menu = page.locator('.toolbar-popup__dropdown-items[data-dropdown-key="add"]')

      await expect(menu).toBeVisible()
      expect(
        await trigger.evaluate(
          (element, menuElement) => element.nextElementSibling === menuElement,
          await menu.elementHandle(),
        ),
      ).toBe(true)
    })

    test('should return focus to the row-menu trigger after an action', async () => {
      // PYLD-3746
      const menu = await openFirstBlockActions({ page, postsURL })
      const trigger = page.locator('#field-layout .array-actions__button').first()

      await menu.getByRole('menuitem', { name: /duplicate/i }).click()
      await expect(trigger).toBeFocused()
    })

    test('should move focus into a row menu opened from the keyboard', async () => {
      // PYLD-3747
      await addTextBlock({ page, postsURL })
      await page.locator('#field-items .array-field__add-row').click()

      for (const trigger of [
        page.locator('#field-layout .array-actions__button').first(),
        page.locator('#field-items .array-actions__button').first(),
      ]) {
        const popup = page.locator('.popup__content').last()

        await openPopupWithKeyboard({
          page,
          popup,
          trigger,
        })
        await expect(popup.locator(':focus')).toBeVisible()
        await page.keyboard.press('Escape')
      }

      await gotoFirstPost({ page, postsURL, serverURL })
      const documentControlsPopup = page.locator('.popup__content').last()

      await openPopupWithKeyboard({
        page,
        popup: documentControlsPopup,
        trigger: page.locator('.doc-controls__popup .popup__trigger-wrap button'),
      })
      await expect(documentControlsPopup.locator(':focus')).toBeVisible()
    })

    test('should expose only one focus target for each filter combobox', async () => {
      // PYLD-3753
      const whereBuilder = await openPostsFilter({ page, postsURL })
      const fieldSelect = whereBuilder.locator('.condition__field')

      const indicator = fieldSelect.locator('.dropdown-indicator')
      await expect(indicator).toHaveAttribute('aria-hidden', 'true')
      expect(await indicator.evaluate((element) => element.tagName)).toBe('DIV')
    })

    test('should keyboard-focus every Group by field option', async () => {
      // PYLD-3782
      await gotoPostsList({ page, postsURL })
      const { groupByContent: groupByPopup } = await openGroupBy(page)
      const fieldTrigger = groupByPopup.locator('.group-by-control__select-trigger').first()
      await fieldTrigger.press('Enter')
      const items = page.locator('.popup__content').last().locator('button')
      const itemCount = await items.count()

      expect(itemCount).toBeGreaterThan(2)
      for (let index = 0; index < itemCount; index++) {
        if (index > 0) {
          await page.keyboard.press('ArrowDown')
        }
        await expect(items.nth(index)).toBeFocused()
      }
    })

    test('should focus each row label before its More options control', async () => {
      // PYLD-3787
      await addTextBlock({ page, postsURL })
      await page.locator('#field-items .array-field__add-row').click()

      for (const row of [
        page.locator('#field-layout .blocks-field__row').first(),
        page.locator('#field-items .array-field__row').first(),
      ]) {
        const label = row.locator('.collapsible__toggle')
        const moreOptions = row.locator('.array-actions__button')

        expect(
          await label.evaluate(
            (element, action) =>
              Boolean(
                element.compareDocumentPosition(action as Node) & Node.DOCUMENT_POSITION_FOLLOWING,
              ),
            await moreOptions.elementHandle(),
          ),
        ).toBe(true)

        await label.focus()
        let reachedMoreOptions = false
        for (let tab = 0; tab < 4; tab++) {
          await page.keyboard.press('Tab')
          if (await moreOptions.evaluate((element) => document.activeElement === element)) {
            reachedMoreOptions = true
            break
          }
        }
        expect(reachedMoreOptions).toBe(true)
      }
    })

    test('sortable value labels provide a dedicated keyboard drag control', async () => {
      // PYLD-3810
      await gotoCreatePost({ page, postsURL })
      const select = page.locator('#field-accessibilitySortableSelect')
      const draggableValue = select.locator('.rs__multi-value').first()
      const dragLabel = draggableValue.getByRole('button', {
        name: /drag to reorder.*value one/i,
      })
      const removeButton = draggableValue.locator('.multi-value-remove')

      await expect(draggableValue).toBeVisible()
      await expect(draggableValue).not.toHaveAttribute('role', 'button')
      await expect(draggableValue.locator('button')).toHaveCount(2)
      await expect(dragLabel).toHaveClass(/multi-value-label__drag-button/)
      await expect(dragLabel).toBeVisible()
      await expect(dragLabel).toContainText('Value One')
      await expect(dragLabel.locator('svg')).toHaveCount(0)
      await expect(dragLabel).toHaveAccessibleName(/1 of 2/i)
      await removeButton.focus()
      await expect(removeButton).toBeFocused()

      const labelsBefore = await select.locator('.multi-value-label').allTextContents()
      await dragLabel.focus()
      await expect
        .poll(() => draggableValue.evaluate((element) => getComputedStyle(element).outlineStyle))
        .not.toBe('none')
      await page.keyboard.press('Space')
      await expect(page.locator('body')).toHaveClass(/is-dragging/)
      await expect(dragLabel).toBeFocused()
      const dragStatus = page.getByRole('status').filter({ hasText: /draggable item one/i })
      await expect(dragStatus).toContainText(/droppable area one/i)
      await dragLabel.press('ArrowRight')
      await expect(dragStatus).toContainText(/droppable area two/i)
      await page.keyboard.press('Space')
      await expect(page.locator('body')).not.toHaveClass(/is-dragging/)
      await expect
        .poll(() => select.locator('.multi-value-label').allTextContents())
        .toEqual([labelsBefore[1], labelsBefore[0]])

      const reorderedLabels = select.getByRole('button', { name: /drag to reorder/i })
      const sourceBox = await reorderedLabels.nth(0).boundingBox()
      const targetBox = await select.locator('.rs__multi-value').nth(1).boundingBox()
      expect(sourceBox).not.toBeNull()
      expect(targetBox).not.toBeNull()
      await page.mouse.move(
        sourceBox!.x + sourceBox!.width / 2,
        sourceBox!.y + sourceBox!.height / 2,
      )
      await page.mouse.down()
      await page.mouse.move(
        sourceBox!.x + sourceBox!.width + 8,
        sourceBox!.y + sourceBox!.height / 2,
        {
          steps: 5,
        },
      )
      await page.mouse.move(
        targetBox!.x + targetBox!.width / 2,
        targetBox!.y + targetBox!.height / 2,
        {
          steps: 10,
        },
      )
      await page.mouse.up()
      await expect
        .poll(() => select.locator('.multi-value-label').allTextContents())
        .toEqual(labelsBefore)
    })

    test('disabled select indicators cannot receive focus', async () => {
      // PYLD-3813
      await gotoCreatePost({ page, postsURL })
      const indicator = page.locator('#field-accessibilityDisabledSelect .dropdown-indicator')

      await expect(indicator).toBeVisible()
      expect(
        await indicator.evaluate((element) => {
          ;(element as HTMLElement).focus()
          return document.activeElement === element
        }),
      ).toBe(false)
    })
  })

  test.describe('2.4.6 Headings and Labels (AA)', () => {
    test('should distinguish new-folder actions by their destination column', async () => {
      // PYLD-3584
      // No criterion was supplied in the report; 2.4.6 is the best-fit classification.
      const modal = await openFolderCreationLocation({ page, serverURL })

      await modal
        .locator('.hierarchy-column-item')
        .filter({ hasText: /^Accessibility folder$/ })
        .press('Enter')
      const columns = modal.locator('.hierarchy-column')

      await expect(columns).toHaveCount(2)
      await expect
        .soft(columns.nth(0).getByRole('button', { name: /new folder/i }))
        .toHaveAccessibleName(/new folder.*all/i)
      await expect
        .soft(columns.nth(1).getByRole('button', { name: /new folder/i }))
        .toHaveAccessibleName(/new folder.*accessibility folder/i)
    })

    test('should name the API-key confirmation close control without an internal identifier', async () => {
      // PYLD-3617
      const dialog = await openAPIKeyDialog({ page, serverURL })

      await expect(dialog.locator('.dialog__header-end button')).toHaveAccessibleName('Close')
    })

    test('should name the live-preview unpublish confirmation close control clearly', async () => {
      // PYLD-3727
      await openLivePreview({ page, postsURL, serverURL })
      await page.locator('.doc-controls__popup .popup__trigger-wrap button').click()
      await page.locator('#action-unpublish').click()
      const dialog = page.locator('.dialog').filter({ hasText: /confirm unpublish/i })

      await expect(dialog).toBeVisible()
      await expect(dialog.locator('.dialog__header-end button')).toHaveAccessibleName('Close')
    })

    test('should give each bulk-edit remove control a unique field-specific label', async () => {
      // PYLD-3768
      const fieldSelect = await openBulkEditFieldSelect({ page, postsURL })
      await selectInput({ multiSelect: false, option: 'Title', page, selectLocator: fieldSelect })
      await selectInput({
        multiSelect: false,
        option: 'Accessibility Select',
        page,
        selectLocator: fieldSelect,
      })
      const removeButtons = fieldSelect.locator('.multi-value-remove')

      await expect(removeButtons.nth(0)).toHaveAccessibleName(/remove.*title/i)
      await expect(removeButtons.nth(1)).toHaveAccessibleName(/remove.*accessibility select/i)
    })
  })

  test.describe('2.4.7 Focus Visible (AA)', () => {
    test('should not tab to an invisible widget drawer dismissal region', async () => {
      // PYLD-3633
      const { drawer, trigger } = await openWidgetDrawer({ page, serverURL })

      await trigger.press('Enter')
      await expect(drawer).toBeVisible()
      const dismissal = drawer.locator(':scope > .drawer__close')
      const unfocusedStyle = await getFocusIndicatorStyle(dismissal)
      const stopCount = await drawer.locator('button, input, a[href], [tabindex="0"]').count()

      for (let step = 0; step <= stopCount + 1; step++) {
        await page.keyboard.press('Tab')
        if (await dismissal.evaluate((element) => element === document.activeElement)) {
          const focusedStyle = await getFocusIndicatorStyle(dismissal)

          expect.soft(hasRenderedFocusIndicator({ focusedStyle, unfocusedStyle })).toBe(true)
        }
      }
    })

    test('should render a visible focus indicator on date-picker month and year selects', async () => {
      // PYLD-3738
      const { monthSelect, yearSelect } = await openBlockDatePicker({ page, postsURL })

      for (const select of [monthSelect, yearSelect]) {
        const unfocusedStyle = await getFocusIndicatorStyle(select)
        await select.focus()
        await expect(select).toBeFocused()
        await expect
          .poll(async () =>
            hasRenderedFocusIndicator({
              focusedStyle: await getFocusIndicatorStyle(select),
              unfocusedStyle,
            }),
          )
          .toBe(true)
      }
    })
  })

  test.describe('2.5.8 Target Size (Minimum) (AA)', () => {
    test('selected-value remove controls only dim their icon on hover', async () => {
      // Additional coverage for PYLD-3811.
      await gotoCreatePost({ page, postsURL })
      const removeButton = page
        .locator('#field-accessibilitySortableSelect .multi-value-remove')
        .first()
      const removeIcon = removeButton.locator('.multi-value-remove__icon')
      const defaultIconOpacity = Number.parseFloat(await removeIcon.evaluate(getComputedOpacity))

      await removeButton.hover()

      await expect
        .poll(async () => Number.parseFloat(await removeIcon.evaluate(getComputedOpacity)))
        .toBeLessThan(defaultIconOpacity)
      expect(await removeButton.evaluate(getComputedBackgroundColor)).toBe('rgba(0, 0, 0, 0)')
      expect(await removeButton.evaluate(getPseudoBackgroundColor)).toBe('rgba(0, 0, 0, 0)')
    })

    test('selected-value controls provide invisible 24px targets without enlarging the chip', async () => {
      // PYLD-3811
      // Additional coverage for PYLD-3810.
      await gotoCreatePost({ page, postsURL })
      const select = page.locator('#field-accessibilitySortableSelect')
      const chip = select.locator('.rs__multi-value').first()
      const controls = [
        chip.locator('.multi-value-label__drag-button'),
        chip.locator('.multi-value-remove'),
      ]

      for (const control of controls) {
        await expect(control).toBeVisible()
        const [chipBox, controlBox] = await Promise.all([chip.boundingBox(), control.boundingBox()])

        expect(chipBox).not.toBeNull()
        expect(controlBox).not.toBeNull()
        expect(controlBox!.width).toBeGreaterThanOrEqual(24)
        expect(controlBox!.height).toBeGreaterThanOrEqual(24)
        expect(chipBox!.height).toBe(20)
      }

      expect(
        await chip
          .locator('.multi-value-remove')
          .evaluate((element) => Number.parseFloat(getComputedStyle(element, '::before').height)),
      ).toBe(24)
      expect(
        await chip
          .locator('.multi-value-remove')
          .evaluate((element) => Number.parseFloat(getComputedStyle(element, '::before').width)),
      ).toBe(24)

      const targetRects = await select
        .locator('.multi-value-label__drag-button, .multi-value-remove')
        .evaluateAll((elements) =>
          elements.map((element) => {
            const { bottom, left, right, top } = element.getBoundingClientRect()
            return { bottom, left, right, top }
          }),
        )

      for (const [index, rect] of targetRects.entries()) {
        for (const otherRect of targetRects.slice(index + 1)) {
          const overlaps =
            rect.left < otherRect.right &&
            rect.right > otherRect.left &&
            rect.top < otherRect.bottom &&
            rect.bottom > otherRect.top
          expect(overlaps).toBe(false)
        }
      }
    })
  })

  test.describe('4.1.2 Name, Role, Value (A)', () => {
    for (const { label, open } of [
      { label: 'upload', open: openRichTextUploadDrawer },
      { label: 'relationship', open: openRichTextRelationshipDrawer },
    ]) {
      for (const [index, control] of ['field', 'operator'].entries()) {
        test(`should expose named ${control} filter options in the rich-text ${label} drawer`, async () => {
          // Additional coverage for PYLD-3662; NVDA browse-mode output is checked in screen-reader.spec.ts.
          const drawer = await open({ page, postsURL })
          const comboboxes = await openDrawerFilters({
            collectionLabel: label === 'relationship' ? 'Post' : undefined,
            drawer,
          })
          const combobox = comboboxes.nth(index)

          await combobox.focus()
          await combobox.press('ArrowDown')
          await expect(page.getByRole('option').first()).toBeVisible()
          await expectOptionsToHaveAccessibleNames(page.getByRole('option'))
        })
      }
    }

    test('should name the image focal-point control by its purpose', async () => {
      // PYLD-3577
      const dialog = await openEditImageDialog({ page, serverURL })

      await expect(dialog.locator('.edit-upload__focalPoint')).toHaveAccessibleName(/focal point/i)
    })

    test('should expose the active locale as selected rather than disabled', async () => {
      // Additional coverage for PYLD-3699.
      // Additional coverage for PYLD-3700.
      // Additional coverage for PYLD-3730.
      const options = await openLocaleOptions({ page, postsURL })
      const selectedOption = options.filter({ hasText: 'English' })

      await expect(selectedOption).toHaveRole('menuitemradio')
      await expect(selectedOption).toHaveAttribute('aria-checked', 'true')
      await expect(selectedOption).not.toHaveAttribute('aria-disabled', 'true')
    })

    test('should expose the current locale and popup state on the locale selector', async () => {
      // Additional coverage for PYLD-3704.
      await gotoPostsList({ page, postsURL })
      const trigger = page.locator('.localizer .popup__trigger-wrap button')

      await expect(trigger).toHaveAccessibleName('Locale: English (en)')
      await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    })

    test('should expose menu semantics and state on the Dashboard menu button', async () => {
      // PYLD-3638
      await page.goto(`${serverURL}/admin`)
      const trigger = page.locator('.dashboard-breadcrumb-dropdown .popup__trigger-wrap button')

      await expect(trigger).toHaveAccessibleName('Dashboard')
      await expect(trigger).toHaveAttribute('aria-haspopup', /true|menu/)
      await expect(trigger).toHaveAttribute('aria-expanded', 'false')
      await trigger.click()
      const controlledPopupId = await trigger.getAttribute('aria-controls')
      const menu = page.locator(`#${controlledPopupId}`)
      await expect(menu).toBeVisible()
      await expect(menu).toHaveAttribute('role', 'menu')
      await expect(menu.getByRole('menu')).toHaveCount(0)
      expect(await menu.getByRole('menuitem').count()).toBeGreaterThan(0)
    })

    test('should expose nested User menu triggers as items in one menu', async () => {
      // Additional coverage for PYLD-3645 and PYLD-3697.
      await page.goto(`${serverURL}/admin`)
      const trigger = page.locator('.user-menu__trigger')

      await trigger.press('Enter')
      const controlledPopupId = await trigger.getAttribute('aria-controls')
      const menu = page.locator(`#${controlledPopupId}`)

      await expect(menu).toHaveAttribute('role', 'menu')
      await expect(menu.getByRole('menu')).toHaveCount(0)
      await expect(menu.getByRole('menuitem', { name: /theme/i })).toHaveCount(1)
      await expect(menu.getByRole('menuitem', { name: /language/i })).toHaveCount(1)
    })

    test('should give the rich-text relationship per-page control an accessible name', async () => {
      // PYLD-3657
      const drawer = await openRichTextRelationshipDrawer({ page, postsURL })
      await expect(drawer.locator('.per-page .popup__trigger-wrap button')).toHaveAccessibleName(
        /per page/i,
      )
    })

    test('should expose the selected state of active rich-text format buttons', async () => {
      // PYLD-3670
      await gotoCreatePost({ page, postsURL })
      const editor = page.locator('.rich-text-lexical [contenteditable="true"]')
      await editor.fill('Accessible text')
      await editor.selectText()
      const boldButton = page.locator('.toolbar-popup__button-bold').first()
      await boldButton.click()

      await expect(boldButton).toHaveAttribute('aria-pressed', 'true')
    })

    test('should expose the selected state of active rich-text alignment options', async () => {
      // PYLD-3673
      await gotoCreatePost({ page, postsURL })
      const alignmentTrigger = page.locator('.toolbar-popup__dropdown-align').first()
      await alignmentTrigger.click()
      const center = page.locator('.toolbar-popup__dropdown-item-alignCenter')
      await center.click()
      await alignmentTrigger.click()

      const selectedCenter = page.locator('.toolbar-popup__dropdown-item-alignCenter')
      await expect(selectedCenter).toHaveAttribute('role', 'menuitemcheckbox')
      await expect(selectedCenter).toHaveAttribute('aria-checked', 'true')
    })

    test('should expose the selected folder as the current creation location', async () => {
      // Additional coverage for PYLD-3585.
      const modal = await openFolderCreationLocation({ page, serverURL })
      const folder = modal.locator('.hierarchy-column-item', {
        hasText: 'Accessibility folder',
      })

      await folder.getByRole('checkbox').click()

      await expect(folder).toHaveAttribute('aria-current', 'location')
    })

    test('should expose expanded state on rich-text dropdown buttons', async () => {
      // PYLD-3677
      await gotoCreatePost({ page, postsURL })
      const addDropdown = page.locator('.rich-text-lexical .toolbar-popup__dropdown-add')
      await addDropdown.click()

      await expect(addDropdown).toHaveAttribute('aria-expanded', 'true')
    })

    test('should expose names, selected states, and expansion state for comparison controls', async () => {
      // PYLD-3719
      // PYLD-3720
      // PYLD-3721
      const trigger = page.locator('.view-version__toggle-locales')

      await openVersionComparison({ page, postsURL, serverURL })
      await expect(trigger).toHaveAttribute('aria-expanded', 'false')
      await trigger.click()
      await expect(trigger).toHaveAttribute('aria-expanded', 'true')
      const selected = page.locator('.popup-button-list__button--selected').last()
      await expect(selected).toHaveAttribute('aria-checked', 'true')

      const select = page.locator('.compare-version .rs__control').first()
      await select.click()
      const options = page.locator('.rs__option')
      const accessibleNames = await expectOptionsToHaveAccessibleNames(options, { areUnique: true })

      expect(accessibleNames[0]).toMatch(/^Previous Version .+ \d{4}, \d{1,2}:\d{2} [AP]M$/)
      expect(accessibleNames).toContain('More versions...')
    })

    test('should give date-picker month and year selects accessible names', async () => {
      // PYLD-3737
      const { monthSelect, yearSelect } = await openBlockDatePicker({ page, postsURL })

      await expect(monthSelect).toHaveAccessibleName(/month/i)
      await expect(yearSelect).toHaveAccessibleName(/year/i)
    })

    test('should give Array and Blocks More options controls unique names and menu state', async () => {
      // PYLD-3744
      await addTextBlock({ page, postsURL })
      await page.locator('#field-items .array-field__add-row').click()
      const blocksButton = page.locator('#field-layout .array-actions__button').first()
      const arrayButton = page.locator('#field-items .array-actions__button').first()

      await expect(blocksButton).toHaveAccessibleName(/layout|text block/i)
      await expect(arrayButton).toHaveAccessibleName(/item/i)
      await expect(blocksButton).not.toHaveAttribute(
        'aria-label',
        await arrayButton.getAttribute('aria-label'),
      )
      await expect(blocksButton).toHaveAttribute('aria-haspopup', /true|menu/)
      await expect(arrayButton).toHaveAttribute('aria-haspopup', /true|menu/)
    })

    test('should give filter and bulk-edit controls and options meaningful accessible names', async () => {
      // PYLD-3751
      // PYLD-3754
      test.slow()
      const whereBuilder = await openPostsFilter({ page, postsURL })
      const filterComboboxes = whereBuilder.locator('input[role="combobox"]')

      expect(await filterComboboxes.count()).toBeGreaterThan(0)
      await expect
        .soft(whereBuilder.locator('.condition__field input[role="combobox"]'))
        .toHaveAccessibleName(/where|field/i)
      for (let index = 0; index < (await filterComboboxes.count()); index++) {
        await expect.soft(filterComboboxes.nth(index)).toHaveAccessibleName(/\S/)
      }

      await whereBuilder.locator('.condition__field .rs__control').click()
      await expectOptionsToHaveAccessibleNames(page.locator('.rs__option'))

      const fieldSelect = await openBulkEditFieldSelect({ page, postsURL })
      const bulkEditCombobox = fieldSelect.locator('input[role="combobox"]')
      await expect.soft(bulkEditCombobox).toHaveAccessibleName(/select fields to edit/i)
      await bulkEditCombobox.focus()
      await bulkEditCombobox.press('ArrowDown')
      await bulkEditCombobox.press('ArrowDown')
      const bulkEditOptions = page.locator('.rs__option')
      await expectOptionsToHaveAccessibleNames(bulkEditOptions)
    })

    test('should give the bulk-edit clear control an accessible name', async () => {
      // PYLD-3755
      const fieldSelect = await openBulkEditFieldSelect({ page, postsURL })
      await selectInput({ multiSelect: false, option: 'Title', page, selectLocator: fieldSelect })

      await expect(fieldSelect.locator('.clear-indicator')).toHaveAccessibleName(
        /clear.*select fields to edit/i,
      )
    })

    test('should expose names, menu roles, and state on Group by controls', async () => {
      // PYLD-3783
      await gotoPostsList({ page, postsURL })
      const { groupByContent: groupByPopup } = await openGroupBy(page)
      const field = groupByPopup.locator('.group-by-control__select-trigger').first()
      const sort = groupByPopup.locator('.group-by-control__select-trigger').nth(1)

      await expect(page.getByRole('dialog', { name: /group by/i })).toBeVisible()
      await expect(field).toHaveAccessibleName(/field/i)
      await expect(field).toHaveAttribute('aria-haspopup', /true|menu/)
      await expect(field).toHaveAttribute('aria-expanded', 'false')
      await expect(sort).toHaveAccessibleName(/sort/i)
    })

    test('aria-hidden dropdown indicators are not keyboard-focusable', async () => {
      // PYLD-3812
      await gotoCreatePost({ page, postsURL })
      const indicator = page.locator('#field-accessibilitySelect .dropdown-indicator')

      await expect(indicator).toBeVisible()
      const isHiddenAndFocusable = await indicator.evaluate((element: HTMLButtonElement) => {
        return (
          element.getAttribute('aria-hidden') === 'true' &&
          !element.disabled &&
          element.tabIndex >= 0
        )
      })

      expect(isHiddenAndFocusable).toBe(false)
    })
  })
  test.describe('4.1.3 Status Messages (AA)', () => {
    test('should expose and dismiss a failed drawer submission notification', async () => {
      const drawer = await openRelationshipCreationDrawer({ page, postsURL })

      await page.route('**/api/posts*', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            body: JSON.stringify({ errors: [{ message: 'Review the document before saving.' }] }),
            contentType: 'application/json',
            status: 400,
          })
        } else {
          await route.continue()
        }
      })
      try {
        await drawer.getByRole('button', { name: /publish in english/i }).click()
        const notification = page.locator('[data-sonner-toast]').filter({
          hasText: 'Review the document before saving.',
        })

        await expect(notification).toBeVisible()
        await expect(drawer).toBeVisible()
        await expect(notification.getByRole('button', { name: /close toast/i })).toBeVisible()
        const close = notification.getByRole('button', { name: /close toast/i })

        await close.focus()
        await expect(close).toBeFocused()
        await close.press('Enter')
        await expect(notification).toBeHidden()
        await expect(drawer).toBeVisible()
      } finally {
        await page.unrouteAll({ behavior: 'wait' })
      }
    })
  })
})

function getComputedBackgroundColor(element: HTMLElement): string {
  return getComputedStyle(element).backgroundColor
}

function getComputedOpacity(element: HTMLElement): string {
  return getComputedStyle(element).opacity
}

function getPseudoBackgroundColor(element: HTMLElement): string {
  return getComputedStyle(element, '::before').backgroundColor
}

async function compareHeadingWithOriginalSpan({
  heading,
  originalStyle,
}: {
  heading: Locator
  originalStyle: string
}) {
  return heading.evaluate((element, styleText) => {
    const measure = (node: HTMLElement) => {
      const style = getComputedStyle(node)
      const bounds = node.getBoundingClientRect()

      return {
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        height: bounds.height,
        lineHeight: style.lineHeight,
        margin: style.margin,
        width: bounds.width,
      }
    }
    const after = measure(element)
    const beforeElement = document.createElement('span')

    beforeElement.textContent = element.textContent
    // Keep the baseline independent of the current heading class.
    beforeElement.style.cssText = styleText
    element.replaceWith(beforeElement)
    try {
      return { after, before: measure(beforeElement) }
    } finally {
      beforeElement.replaceWith(element)
    }
  }, originalStyle)
}

function getCallouts({ container }: { container: Locator }) {
  return container.locator('.rich-text-lexical .collapsible').filter({
    has: container.page().locator('input[value$="callout"]'),
  })
}

async function openRichTextContext({
  isDrawer,
  page,
  postsURL,
}: {
  isDrawer: boolean
  page: Page
  postsURL: AdminUrlUtil
}) {
  if (isDrawer) {
    return openRelationshipCreationDrawer({ page, postsURL })
  }
  await gotoCreatePost({ page, postsURL })
  return page.locator('main')
}
