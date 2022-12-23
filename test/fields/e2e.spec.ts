import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { AdminUrlUtil } from '../helpers/adminUrlUtil';
import { initPayloadE2E } from '../helpers/configHelpers';
import { login, saveDocAndAssert } from '../helpers';
import { textDoc } from './collections/Text';
import { arrayFieldsSlug } from './collections/Array';
import { pointFieldsSlug } from './collections/Point';
import { tabsSlug } from './collections/Tabs';
import { collapsibleFieldsSlug } from './collections/Collapsible';
import wait from '../../src/utilities/wait';

const { beforeAll, describe } = test;

let page: Page;
let serverURL;

describe('fields', () => {
  beforeAll(async ({ browser }) => {
    const config = await initPayloadE2E(__dirname);
    serverURL = config.serverURL;

    const context = await browser.newContext();
    page = await context.newPage();

    await login({ page, serverURL });
  });

  describe('text', () => {
    let url: AdminUrlUtil;
    beforeAll(() => {
      url = new AdminUrlUtil(serverURL, 'text-fields');
    });

    test('should display field in list view', async () => {
      await page.goto(url.list);
      const textCell = page.locator('.row-1 .cell-text');
      await expect(textCell)
        .toHaveText(textDoc.text);
    });

    test('should display i18n label in cells when missing field data', async () => {
      await page.goto(url.list);
      const textCell = page.locator('.row-1 .cell-i18nText');
      await expect(textCell)
        .toHaveText('<No Text en>');
    });

    test('should show i18n label', async () => {
      await page.goto(url.create);

      await expect(page.locator('label[for="field-i18nText"]')).toHaveText('Text en');
    });

    test('should show i18n placeholder', async () => {
      await page.goto(url.create);
      await expect(await page.locator('#field-i18nText')).toHaveAttribute('placeholder', 'en placeholder');
    });

    test('should show i18n descriptions', async () => {
      await page.goto(url.create);
      const description = page.locator('.field-description-i18nText');
      await expect(description).toHaveText('en description');
    });
  });

  describe('radio', () => {
    let url: AdminUrlUtil;
    beforeAll(() => {
      url = new AdminUrlUtil(serverURL, 'radio-fields');
    });

    test('should show i18n label in list', async () => {
      await page.goto(url.list);
      await expect(page.locator('.cell-radio')).toHaveText('Value One');
    });

    test('should show i18n label while editing', async () => {
      await page.goto(url.create);
      await expect(page.locator('label[for="field-radio"]')).toHaveText('Radio en');
    });

    test('should show i18n radio labels', async () => {
      await page.goto(url.create);
      await expect(await page.locator('label[for="field-radio-one"] .radio-input__label'))
        .toHaveText('Value One');
    });
  });

  describe('select', () => {
    let url: AdminUrlUtil;
    beforeAll(() => {
      url = new AdminUrlUtil(serverURL, 'select-fields');
    });

    test('should use i18n option labels', async () => {
      await page.goto(url.create);

      const field = page.locator('#field-selectI18n');
      await field.click({ delay: 100 });
      const options = page.locator('.rs__option');
      // Select an option
      await options.locator('text=One').click();

      await saveDocAndAssert(page);
      await expect(field.locator('.rs__value-container')).toContainText('One');
    });
  });

  describe('point', () => {
    let url: AdminUrlUtil;
    beforeAll(() => {
      url = new AdminUrlUtil(serverURL, pointFieldsSlug);
    });

    test('should save point', async () => {
      await page.goto(url.create);
      const longField = page.locator('#field-longitude-point');
      await longField.fill('9');

      const latField = page.locator('#field-latitude-point');
      await latField.fill('-2');

      const localizedLongField = page.locator('#field-longitude-localized');
      await localizedLongField.fill('1');

      const localizedLatField = page.locator('#field-latitude-localized');
      await localizedLatField.fill('-1');

      const groupLongitude = page.locator('#field-longitude-group__point');
      await groupLongitude.fill('3');

      const groupLatField = page.locator('#field-latitude-group__point');
      await groupLatField.fill('-8');

      await saveDocAndAssert(page);
    });
  });

  describe('collapsible', () => {
    let url: AdminUrlUtil;
    beforeAll(() => {
      url = new AdminUrlUtil(serverURL, collapsibleFieldsSlug);
    });

    test('should render CollapsibleLabel using a function', async () => {
      const label = 'custom row label';
      await page.goto(url.create);
      await page.locator('#field-collapsible-3__1 >> #field-nestedTitle').fill(label);
      await wait(100);
      const customCollapsibleLabel = await page.locator('#field-collapsible-3__1 >> .row-label');
      await expect(customCollapsibleLabel).toContainText(label);
    });

    test('should render CollapsibleLabel using a component', async () => {
      const label = 'custom row label as component';
      await page.goto(url.create);
      await page.locator('#field-arrayWithCollapsibles >> .array-field__add-button-wrap >> button').click();

      await page.locator('#field-collapsible-4__0-arrayWithCollapsibles__0 >> #field-arrayWithCollapsibles__0__innerCollapsible').fill(label);
      await wait(100);
      const customCollapsibleLabel = await page.locator(`#field-collapsible-4__0-arrayWithCollapsibles__0 >> .row-label :text("${label}")`);
      await expect(customCollapsibleLabel).toHaveCSS('text-transform', 'uppercase');
    });
  });

  describe('blocks', () => {
    let url: AdminUrlUtil;
    beforeAll(() => {
      url = new AdminUrlUtil(serverURL, 'block-fields');
    });

    test('should use i18n block labels', async () => {
      await page.goto(url.create);
      await expect(page.locator('#field-i18nBlocks .blocks-field__header')).toContainText('Block en');

      const addButton = page.locator('#field-i18nBlocks .btn__label');
      await expect(addButton).toContainText('Add Block en');
      await addButton.click();

      const blockSelector = page.locator('#field-i18nBlocks .block-selector .block-selection').first();
      await expect(blockSelector).toContainText('Text en');
      await blockSelector.click();

      await expect(page.locator('#i18nBlocks-row-0 .blocks-field__block-pill-text')).toContainText('Text en');
    });
  });

  describe('array', () => {
    let url: AdminUrlUtil;
    beforeAll(() => {
      url = new AdminUrlUtil(serverURL, arrayFieldsSlug);
    });

    test('should be readOnly', async () => {
      await page.goto(url.create);
      const field = page.locator('#field-readOnly__0__text');
      await expect(field)
        .toBeDisabled();
    });

    test('should have defaultValue', async () => {
      await page.goto(url.create);
      const field = page.locator('#field-readOnly__0__text');
      await expect(field)
        .toHaveValue('defaultValue');
    });

    test('should render RowLabel using a function', async () => {
      const label = 'custom row label as function';
      await page.goto(url.create);
      await page.locator('#field-rowLabelAsFunction >> .array-field__add-button-wrap >> button').click();

      await page.locator('#field-rowLabelAsFunction__0__title').fill(label);
      await wait(100);
      const customRowLabel = await page.locator('#rowLabelAsFunction-row-0 >> .row-label');
      await expect(customRowLabel).toContainText(label);
    });

    test('should render RowLabel using a component', async () => {
      const label = 'custom row label as component';
      await page.goto(url.create);
      await page.locator('#field-rowLabelAsComponent >> .array-field__add-button-wrap >> button').click();

      await page.locator('#field-rowLabelAsComponent__0__title').fill(label);
      await wait(100);
      const customRowLabel = await page.locator('#rowLabelAsComponent-row-0 >> .row-label :text("custom row label")');
      await expect(customRowLabel).toHaveCSS('text-transform', 'uppercase');
    });
  });

  describe('tabs', () => {
    let url: AdminUrlUtil;
    beforeAll(() => {
      url = new AdminUrlUtil(serverURL, tabsSlug);
    });

    test('should fill and retain a new value within a tab while switching tabs', async () => {
      const textInRowValue = 'hello';
      const numberInRowValue = '23';

      await page.goto(url.create);

      await page.locator('.tabs-field__tab-button:has-text("Tab with Row")').click();
      await page.locator('#field-textInRow').fill(textInRowValue);
      await page.locator('#field-numberInRow').fill(numberInRowValue);

      await wait(300);

      await page.locator('.tabs-field__tab-button:has-text("Tab with Array")').click();
      await page.locator('.tabs-field__tab-button:has-text("Tab with Row")').click();

      await wait(100);

      await expect(page.locator('#field-textInRow')).toHaveValue(textInRowValue);
      await expect(page.locator('#field-numberInRow')).toHaveValue(numberInRowValue);
    });

    test('should retain updated values within tabs while switching between tabs', async () => {
      const textInRowValue = 'new value';
      await page.goto(url.list);
      await page.locator('.cell-id a').click();

      // Go to Row tab, update the value
      await page.locator('.tabs-field__tab-button:has-text("Tab with Row")').click();
      await page.locator('#field-textInRow').fill(textInRowValue);

      await wait(250);

      // Go to Array tab, then back to Row. Make sure new value is still there
      await page.locator('.tabs-field__tab-button:has-text("Tab with Array")').click();
      await page.locator('.tabs-field__tab-button:has-text("Tab with Row")').click();

      await expect(page.locator('#field-textInRow')).toHaveValue(textInRowValue);

      // Go to array tab, save the doc
      await page.locator('.tabs-field__tab-button:has-text("Tab with Array")').click();
      await page.click('#action-save', { delay: 100 });

      await wait(250);

      // Go back to row tab, make sure the new value is still present
      await page.locator('.tabs-field__tab-button:has-text("Tab with Row")').click();
      await expect(page.locator('#field-textInRow')).toHaveValue(textInRowValue);
    });
  });

  describe('richText', () => {
    async function navigateToRichTextFields() {
      const url: AdminUrlUtil = new AdminUrlUtil(serverURL, 'rich-text-fields');
      await page.goto(url.list);
      await page.locator('.row-1 .cell-title a').click();
    }

    describe('toolbar', () => {
      test('should create new url link', async () => {
        await navigateToRichTextFields();

        // Open link popup
        await page.locator('.rich-text__toolbar button:not([disabled]) .link').click();

        const editLinkModal = page.locator('.rich-text-link-edit-modal__template');
        await expect(editLinkModal).toBeVisible();

        // Fill values and click Confirm
        await editLinkModal.locator('#field-text').fill('link text');
        await editLinkModal.locator('label[for="field-linkType-custom"]').click();
        await editLinkModal.locator('#field-url').fill('https://payloadcms.com');
        await wait(200);
        await editLinkModal.locator('button[type="submit"]').click();

        // Remove link from editor body
        await page.locator('span >> text="link text"').click();
        const popup = page.locator('.popup--active .rich-text-link__popup');
        await expect(popup.locator('.rich-text-link__link-label')).toBeVisible();
        await popup.locator('.rich-text-link__link-close').click();
        await expect(page.locator('span >> text="link text"')).toHaveCount(0);
      });

      test('should not create new url link when read only', async () => {
        await navigateToRichTextFields();

        // Attempt to open link popup
        const modalTrigger = page.locator('.rich-text--read-only .rich-text__toolbar button .link');
        await expect(modalTrigger).toBeDisabled();
      });
    });

    describe('editor', () => {
      test('should populate url link', async () => {
        navigateToRichTextFields();

        // Open link popup
        await page.locator('#field-richText span >> text="render links"').click();
        const popup = page.locator('.popup--active .rich-text-link__popup');
        await expect(popup).toBeVisible();
        await expect(popup.locator('a')).toHaveAttribute('href', 'https://payloadcms.com');

        // Open link edit modal
        await popup.locator('.rich-text-link__link-edit').click();
        const editLinkModal = page.locator('.rich-text-link-edit-modal__template');
        await expect(editLinkModal).toBeVisible();

        // Close link edit modal
        await editLinkModal.locator('button[type="submit"]').click();
        await expect(editLinkModal).not.toBeVisible();
      });

      test('should populate relationship link', async () => {
        navigateToRichTextFields();

        // Open link popup
        await page.locator('#field-richText span >> text="link to relationships"').click();
        const popup = page.locator('.popup--active .rich-text-link__popup');
        await expect(popup).toBeVisible();
        await expect(popup.locator('a')).toHaveAttribute('href', /\/admin\/collections\/array-fields\/.*/);

        // Open link edit modal
        await popup.locator('.rich-text-link__link-edit').click();
        const editLinkModal = page.locator('.rich-text-link-edit-modal__template');
        await expect(editLinkModal).toBeVisible();

        // Close link edit modal
        await editLinkModal.locator('button[type="submit"]').click();
        await expect(editLinkModal).not.toBeVisible();
      });
    });
  });

  describe('date', () => {
    let url: AdminUrlUtil;
    beforeAll(() => {
      url = new AdminUrlUtil(serverURL, 'date-fields');
    });

    test('should display formatted date in list view if displayFormat option added to date field', async () => {
      await page.goto(url.list);
      const formattedDateCell = page.locator('.row-1 .cell-timeOnly');
      await expect(formattedDateCell).toContainText(' Aug ');

      const notFormattedDateCell = page.locator('.row-1 .cell-default');
      await expect(notFormattedDateCell).toContainText('August');
    });
  });

  describe('relationship', () => {
    let url: AdminUrlUtil;

    beforeAll(() => {
      url = new AdminUrlUtil(serverURL, 'relationship-fields');
    });

    test('should create inline relationship within field with many relations', async () => {
      await page.goto(url.create);

      const button = page.locator('#relationship-add-new .relationship-add-new__add-button');
      await button.click();
      await page.locator('#field-relationship .relationship-add-new__relation-button--text-fields').click();

      const textField = page.locator('#field-text');
      const textValue = 'hello';

      await textField.fill(textValue);

      await page.locator('[id^=doc-drawer_text-fields_1_] #action-save').click();
      await expect(page.locator('.Toastify')).toContainText('successfully');
      await page.locator('[id^=close-drawer__doc-drawer_text-fields_1_]').click();

      await expect(page.locator('#field-relationship .relationship--single-value__text')).toContainText(textValue);

      await page.locator('#action-save').click();
      await expect(page.locator('.Toastify')).toContainText('successfully');
    });

    test('should create nested inline relationships', async () => {
      await page.goto(url.create);

      // Open first modal
      await page.locator('#relationToSelf-add-new .relationship-add-new__add-button').click();

      // Fill first modal's required relationship field
      await page.locator('[id^=doc-drawer_relationship-fields_1_] #field-relationship').click();
      await page.locator('[id^=doc-drawer_relationship-fields_1_] .rs__option:has-text("Seeded text document")').click();

      // Open second modal
      await page.locator('[id^=doc-drawer_relationship-fields_1_] #relationToSelf-add-new button').click();

      // Fill second modal's required relationship field
      await page.locator('[id^=doc-drawer_relationship-fields_2_] #field-relationship').click();
      await page.locator('[id^=doc-drawer_relationship-fields_2_] .rs__option:has-text("Seeded text document")').click();

      // Save then close the second modal
      await page.locator('[id^=doc-drawer_relationship-fields_2_] #action-save').click();
      await wait(200);
      await page.locator('[id^=close-drawer__doc-drawer_relationship-fields_2_]').click();

      // Assert that the first modal is still open and the value matches
      await expect(page.locator('[id^=doc-drawer_relationship-fields_1_]')).toBeVisible();
      await expect(page.locator('[id^=doc-drawer_relationship-fields_1_] #field-relationToSelf .relationship--single-value__text')).toBeVisible(); // TODO: use '.toContainText('doc_id')' with the doc in the second modal

      // Save then close the first modal
      await page.locator('[id^=doc-drawer_relationship-fields_1_] #action-save').click();
      await wait(200);
      await page.locator('[id^=close-drawer__doc-drawer_relationship-fields_1_]').click();

      // Expect the original field to have a value filled
      await expect(page.locator('#field-relationToSelf .relationship--single-value__text')).toBeVisible();

      // Fill the required field
      await page.locator('#field-relationship').click();
      await page.locator('.rs__option:has-text("Seeded text document")').click();

      await page.locator('#action-save').click();

      await expect(page.locator('.Toastify')).toContainText('successfully');
    });
  });
});
