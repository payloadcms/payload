import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import path from 'path';
import payload from '../../src';
import { AdminUrlUtil } from '../helpers/adminUrlUtil';
import { initPayloadE2E } from '../helpers/configHelpers';
import { login, saveDocAndAssert } from '../helpers';
import { textDoc } from './collections/Text';
import { arrayFieldsSlug } from './collections/Array';
import { pointFieldsSlug } from './collections/Point';
import { tabsSlug } from './collections/Tabs';
import { collapsibleFieldsSlug } from './collections/Collapsible';
import wait from '../../src/utilities/wait';
import { jsonDoc } from './collections/JSON';

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

  describe('json', () => {
    let url: AdminUrlUtil;
    beforeAll(() => {
      url = new AdminUrlUtil(serverURL, 'json-fields');
    });

    test('should display field in list view', async () => {
      await page.goto(url.list);
      const jsonCell = page.locator('.row-1 .cell-json');
      await expect(jsonCell)
        .toHaveText(JSON.stringify(jsonDoc.json));
    });

    test('should create', async () => {
      const input = '{"foo": "bar"}';

      await page.goto(url.create);
      const json = page.locator('.json-field .inputarea');
      await json.fill(input);

      await saveDocAndAssert(page, '.form-submit button');
      await expect(page.locator('.json-field')).toContainText('"foo": "bar"');
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
    let filledGroupPoint;
    let emptyGroupPoint;
    beforeAll(async () => {
      url = new AdminUrlUtil(serverURL, pointFieldsSlug);
      filledGroupPoint = await payload.create({
        collection: pointFieldsSlug,
        data: {
          point: [5, 5],
          localized: [4, 2],
          group: { point: [4, 2] },
        },
      });
      emptyGroupPoint = await payload.create({
        collection: pointFieldsSlug,
        data: {
          point: [5, 5],
          localized: [3, -2],
          group: {},
        },
      });
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
      await expect(await longField.getAttribute('value')).toEqual('9');
      await expect(await latField.getAttribute('value')).toEqual('-2');
      await expect(await localizedLongField.getAttribute('value')).toEqual('1');
      await expect(await localizedLatField.getAttribute('value')).toEqual('-1');
      await expect(await groupLongitude.getAttribute('value')).toEqual('3');
      await expect(await groupLatField.getAttribute('value')).toEqual('-8');
    });

    test('should update point', async () => {
      await page.goto(url.edit(emptyGroupPoint.id));
      const longField = page.locator('#field-longitude-point');
      await longField.fill('9');

      const latField = page.locator('#field-latitude-point');
      await latField.fill('-2');

      const localizedLongField = page.locator('#field-longitude-localized');
      await localizedLongField.fill('2');

      const localizedLatField = page.locator('#field-latitude-localized');
      await localizedLatField.fill('-2');

      const groupLongitude = page.locator('#field-longitude-group__point');
      await groupLongitude.fill('3');

      const groupLatField = page.locator('#field-latitude-group__point');
      await groupLatField.fill('-8');

      await saveDocAndAssert(page);

      await expect(await longField.getAttribute('value')).toEqual('9');
      await expect(await latField.getAttribute('value')).toEqual('-2');
      await expect(await localizedLongField.getAttribute('value')).toEqual('2');
      await expect(await localizedLatField.getAttribute('value')).toEqual('-2');
      await expect(await groupLongitude.getAttribute('value')).toEqual('3');
      await expect(await groupLatField.getAttribute('value')).toEqual('-8');
    });

    test('should be able to clear a value point', async () => {
      await page.goto(url.edit(filledGroupPoint.id));

      const groupLongitude = page.locator('#field-longitude-group__point');
      await groupLongitude.fill('');

      const groupLatField = page.locator('#field-latitude-group__point');
      await groupLatField.fill('');

      await saveDocAndAssert(page);

      await expect(await groupLongitude.getAttribute('value')).toEqual('');
      await expect(await groupLatField.getAttribute('value')).toEqual('');
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

    test('should open blocks drawer and select first block', async () => {
      await page.goto(url.create);
      const addButton = page.locator('#field-blocks > .blocks-field__drawer-toggler');
      await expect(addButton).toContainText('Add Block');
      await addButton.click();

      const blocksDrawer = await page.locator('[id^=drawer_1_blocks-drawer-]');
      await expect(blocksDrawer).toBeVisible();

      // select the first block in the drawer
      const firstBlockSelector = await blocksDrawer.locator('.blocks-drawer__blocks .blocks-drawer__block').first();
      await expect(firstBlockSelector).toContainText('Text');
      await firstBlockSelector.click();

      // ensure the block was appended to the rows
      const addedRow = await page.locator('#field-blocks #blocks-row-3');
      await expect(addedRow).toBeVisible();
      await expect(addedRow.locator('.blocks-field__block-pill-text')).toContainText('Text');
    });

    test('should open blocks drawer from block row and add below', async () => {
      await page.goto(url.create);
      const firstRow = await page.locator('#field-blocks #blocks-row-0');
      const rowActions = await firstRow.locator('.collapsible__actions');
      await expect(rowActions).toBeVisible();

      await rowActions.locator('.array-actions__button').click();
      const addBelowButton = await rowActions.locator('.array-actions__action.array-actions__add');
      await expect(addBelowButton).toBeVisible();
      addBelowButton.click();

      const blocksDrawer = await page.locator('[id^=drawer_1_blocks-drawer-]');
      await expect(blocksDrawer).toBeVisible();

      // select the first block in the drawer
      const firstBlockSelector = blocksDrawer.locator('.blocks-drawer__blocks .blocks-drawer__block').first();
      await expect(firstBlockSelector).toContainText('Text');
      await firstBlockSelector.click();

      // ensure the block was inserted beneath the first in the rows
      const addedRow = page.locator('#field-blocks #blocks-row-1');
      await expect(addedRow).toBeVisible();
      await expect(addedRow.locator('.blocks-field__block-pill-text')).toContainText('Text'); // went from `Number` to `Text`
    });

    test('should use i18n block labels', async () => {
      await page.goto(url.create);
      await expect(page.locator('#field-i18nBlocks .blocks-field__header')).toContainText('Block en');

      const addButton = page.locator('#field-i18nBlocks > .blocks-field__drawer-toggler');
      await expect(addButton).toContainText('Add Block en');
      await addButton.click();

      const blocksDrawer = await page.locator('[id^=drawer_1_blocks-drawer-]');
      await expect(blocksDrawer).toBeVisible();

      // select the first block in the drawer
      const firstBlockSelector = blocksDrawer.locator('.blocks-drawer__blocks .blocks-drawer__block').first();
      await expect(firstBlockSelector).toContainText('Text en');
      await firstBlockSelector.click();

      // ensure the block was appended to the rows
      const firstRow = page.locator('#i18nBlocks-row-0');
      await expect(firstRow).toBeVisible();
      await expect(firstRow.locator('.blocks-field__block-pill-text')).toContainText('Text en');
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
      test('should create new url custom link', async () => {
        await navigateToRichTextFields();

        // Open link drawer
        await page.locator('.rich-text__toolbar button:not([disabled]) .link').first().click();

        // find the drawer
        const editLinkModal = await page.locator('[id^=drawer_1_rich-text-link-]');
        await expect(editLinkModal).toBeVisible();

        // Fill values and click Confirm
        await editLinkModal.locator('#field-text').fill('link text');
        await editLinkModal.locator('label[for="field-linkType-custom"]').click();
        await editLinkModal.locator('#field-url').fill('https://payloadcms.com');
        await wait(200);
        await editLinkModal.locator('button[type="submit"]').click();
        await saveDocAndAssert(page);

        // Remove link from editor body
        await page.locator('span >> text="link text"').click();
        const popup = page.locator('.popup--active .rich-text-link__popup');
        await expect(popup.locator('.rich-text-link__link-label')).toBeVisible();
        await popup.locator('.rich-text-link__link-close').click();
        await expect(page.locator('span >> text="link text"')).toHaveCount(0);
      });

      test('should create new internal link', async () => {
        await navigateToRichTextFields();

        // Open link drawer
        await page.locator('.rich-text__toolbar button:not([disabled]) .link').first().click();

        // find the drawer
        const editLinkModal = await page.locator('[id^=drawer_1_rich-text-link-]');
        await expect(editLinkModal).toBeVisible();

        // Fill values and click Confirm
        await editLinkModal.locator('#field-text').fill('link text');
        await editLinkModal.locator('label[for="field-linkType-internal"]').click();
        await editLinkModal.locator('#field-doc .rs__control').click();
        await page.keyboard.type('dev@');
        await editLinkModal.locator('#field-doc .rs__menu .rs__option:has-text("dev@payloadcms.com")').click();
        // await wait(200);
        await editLinkModal.locator('button[type="submit"]').click();
        await saveDocAndAssert(page);
      });

      test('should not create new url link when read only', async () => {
        await navigateToRichTextFields();

        // Attempt to open link popup
        const modalTrigger = page.locator('.rich-text--read-only .rich-text__toolbar button .link');
        await expect(modalTrigger).toBeDisabled();
      });

      test('should only list RTE enabled upload collections in drawer', async () => {
        await navigateToRichTextFields();

        // Open link drawer
        await page.locator('.rich-text__toolbar button:not([disabled]) .upload-rich-text-button').first().click();

        // open the list select menu
        await page.locator('.list-drawer__select-collection-wrap .rs__control').click();

        const menu = page.locator('.list-drawer__select-collection-wrap .rs__menu');
        // `uploads-3` has enableRichTextRelationship set to false
        await expect(menu).not.toContainText('Uploads3');
      });

      test('should only list RTE enabled collections in link drawer', async () => {
        await navigateToRichTextFields();

        await page.locator('.rich-text__toolbar button:not([disabled]) .link').first().click();

        const editLinkModal = await page.locator('[id^=drawer_1_rich-text-link-]');
        await expect(editLinkModal).toBeVisible();

        await editLinkModal.locator('label[for="field-linkType-internal"]').click();
        await editLinkModal.locator('.relationship__wrap .rs__control').click();

        const menu = page.locator('.relationship__wrap .rs__menu');

        // array-fields has enableRichTextLink set to false
        await expect(menu).not.toContainText('Array Fields');
      });

      test('should only list non-upload collections in relationship drawer', async () => {
        await navigateToRichTextFields();

        // Open link drawer
        await page.locator('.rich-text__toolbar button:not([disabled]) .relationship-rich-text-button').first().click();

        // open the list select menu
        await page.locator('.list-drawer__select-collection-wrap .rs__control').click();

        const menu = page.locator('.list-drawer__select-collection-wrap .rs__menu');
        await expect(menu).not.toContainText('Uploads');
      });

      test('should respect customizing the default fields', async () => {
        await navigateToRichTextFields();
        const field = page.locator('.rich-text', { has: page.locator('#field-richTextCustomFields') });
        const button = await field.locator('button.rich-text__button.link');

        await button.click();

        const linkDrawer = await page.locator('[id^=drawer_1_rich-text-link-]');
        await expect(linkDrawer).toBeVisible();
        const fieldCount = await linkDrawer.locator('.render-fields > .field-type').count();
        await expect(fieldCount).toEqual(1);
      });
    });

    describe('editor', () => {
      test('should populate url link', async () => {
        await navigateToRichTextFields();

        // Open link popup
        await page.locator('#field-richText span >> text="render links"').click();
        const popup = page.locator('.popup--active .rich-text-link__popup');
        await expect(popup).toBeVisible();
        await expect(popup.locator('a')).toHaveAttribute('href', 'https://payloadcms.com');

        // Open the drawer
        await popup.locator('.rich-text-link__link-edit').click();
        const editLinkModal = page.locator('[id^=drawer_1_rich-text-link-]');
        await expect(editLinkModal).toBeVisible();

        // Check the drawer values
        const textField = await editLinkModal.locator('#field-text');
        await expect(textField).toHaveValue('render links');

        // Close the drawer
        await editLinkModal.locator('button[type="submit"]').click();
        await expect(editLinkModal).toBeHidden();
      });

      test('should populate relationship link', async () => {
        await navigateToRichTextFields();

        // Open link popup
        await page.locator('#field-richText span >> text="link to relationships"').click();
        const popup = page.locator('.popup--active .rich-text-link__popup');
        await expect(popup).toBeVisible();
        await expect(popup.locator('a')).toHaveAttribute('href', /\/admin\/collections\/array-fields\/.*/);

        // Open the drawer
        await popup.locator('.rich-text-link__link-edit').click();
        const editLinkModal = page.locator('[id^=drawer_1_rich-text-link-]');
        await expect(editLinkModal).toBeVisible();

        // Check the drawer values
        const textField = await editLinkModal.locator('#field-text');
        await expect(textField).toHaveValue('link to relationships');

        // Close the drawer
        await editLinkModal.locator('button[type="submit"]').click();
        await expect(editLinkModal).toBeHidden();
      });

      test('should open upload drawer and render custom relationship fields', async () => {
        await navigateToRichTextFields();
        const field = await page.locator('#field-richText');
        const button = await field.locator('button.rich-text-upload__upload-drawer-toggler');

        await button.click();

        const documentDrawer = await page.locator('[id^=drawer_1_upload-drawer-]');
        await expect(documentDrawer).toBeVisible();
        const caption = await documentDrawer.locator('#field-caption');
        await expect(caption).toBeVisible();
      });

      test('should open upload document drawer from read-only field', async () => {
        await navigateToRichTextFields();
        const field = await page.locator('#field-richTextReadOnly');
        const button = await field.locator('button.rich-text-upload__doc-drawer-toggler.doc-drawer__toggler');

        await button.click();

        const documentDrawer = await page.locator('[id^=doc-drawer_uploads_1_]');
        await expect(documentDrawer).toBeVisible();
      });

      test('should open relationship document drawer from read-only field', async () => {
        await navigateToRichTextFields();
        const field = await page.locator('#field-richTextReadOnly');
        const button = await field.locator('button.rich-text-relationship__doc-drawer-toggler.doc-drawer__toggler');

        await button.click();

        const documentDrawer = await page.locator('[id^=doc-drawer_text-fields_1_]');
        await expect(documentDrawer).toBeVisible();
      });

      test('should populate new links', async () => {
        await navigateToRichTextFields();

        // Highlight existing text
        const headingElement = await page.locator('#field-richText h1 >> text="Hello, I\'m a rich text field."');
        await headingElement.selectText();

        // click the toolbar link button
        await page.locator('.rich-text__toolbar button:not([disabled]) .link').first().click();

        // find the drawer and confirm the values
        const editLinkModal = await page.locator('[id^=drawer_1_rich-text-link-]');
        await expect(editLinkModal).toBeVisible();
        const textField = await editLinkModal.locator('#field-text');
        await expect(textField).toHaveValue('Hello, I\'m a rich text field.');
      });
    });
  });

  describe('date', () => {
    let url: AdminUrlUtil;
    beforeAll(() => {
      url = new AdminUrlUtil(serverURL, 'date-fields');
    });

    test('should display formatted date in list view table cell', async () => {
      await page.goto(url.list);
      const formattedDateCell = page.locator('.row-1 .cell-timeOnly');
      await expect(formattedDateCell).toContainText(' Aug ');

      const notFormattedDateCell = page.locator('.row-1 .cell-default');
      await expect(notFormattedDateCell).toContainText('August');
    });

    test('should display formatted date in useAsTitle', async () => {
      await page.goto(url.list);
      await page.locator('.row-1 .cell-default a').click();
      await expect(page.locator('.collection-edit__header .render-title')).toContainText('August');
    });

    test('should clear date', async () => {
      await page.goto(url.create);
      const dateField = await page.locator('#field-default input');
      await expect(dateField).toBeVisible();
      await dateField.fill('02/07/2023');
      await expect(dateField).toHaveValue('02/07/2023');
      await wait(1000);
      const clearButton = await page.locator('#field-default .date-time-picker__clear-button');
      await expect(clearButton).toBeVisible();
      await clearButton.click();
      await expect(dateField).toHaveValue('');
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

    test('should hide relationship add new button', async () => {
      await page.goto(url.create);
      // expect the button to not exist in the field
      await expect(await page.locator('#relationToSelfSelectOnly-add-new .relationship-add-new__add-button').count()).toEqual(0);
    });

    test('should clear relationship values', async () => {
      await page.goto(url.create);

      const field = await page.locator('#field-relationship');
      await field.click();
      await page.locator('.rs__option:has-text("Seeded text document")').click();
      await field.locator('.clear-indicator').click();
      await expect(field.locator('.rs__placeholder')).toBeVisible();
    });

    test('should populate relationship dynamic default value', async () => {
      await page.goto(url.create);
      await expect(page.locator('#field-relationWithDynamicDefault .relationship--single-value__text')).toContainText('dev@payloadcms.com');
      await expect(page.locator('#field-relationHasManyWithDynamicDefault .relationship--single-value__text')).toContainText('dev@payloadcms.com');
    });

    test('should filter relationship options', async () => {
      await page.goto(url.create);
      await page.locator('#field-relationship .rs__control').click();
      await page.keyboard.type('seeded');
      await page.locator('.rs__option:has-text("Seeded text document")').click();
      await saveDocAndAssert(page);
    });
  });

  describe('upload', () => {
    let url: AdminUrlUtil;
    beforeAll(() => {
      url = new AdminUrlUtil(serverURL, 'uploads');
    });

    test('should upload files', async () => {
      await page.goto(url.create);

      // create a jpg upload
      await page.locator('.file-field__upload input[type="file"]').setInputFiles(path.resolve(__dirname, './collections/Upload/payload.jpg'));
      await expect(page.locator('.file-field .file-field__filename')).toContainText('payload.jpg');
      await page.locator('#action-save').click();
      await wait(200);
      await expect(page.locator('.Toastify')).toContainText('successfully');
    });

    // test that the image renders
    test('should render uploaded image', async () => {
      await expect(page.locator('.file-field .file-details img')).toHaveAttribute('src', '/uploads/payload-1.jpg');
    });

    test('should upload using the document drawer', async () => {
      // Open the media drawer and create a png upload
      await page.locator('.field-type.upload .upload__toggler.doc-drawer__toggler').click();
      await page.locator('[id^=doc-drawer_uploads_1_] .file-field__upload input[type="file"]').setInputFiles(path.resolve(__dirname, './uploads/payload.png'));
      await page.locator('[id^=doc-drawer_uploads_1_] #action-save').click();
      await wait(200);
      await expect(page.locator('.Toastify')).toContainText('successfully');

      // Assert that the media field has the png upload
      await expect(page.locator('.field-type.upload .file-details .file-meta__url a')).toHaveAttribute('href', '/uploads/payload-1.png');
      await expect(page.locator('.field-type.upload .file-details .file-meta__url a')).toContainText('payload-1.png');
      await expect(page.locator('.field-type.upload .file-details img')).toHaveAttribute('src', '/uploads/payload-1.png');
      await page.locator('#action-save').click();
      await wait(200);
      await expect(page.locator('.Toastify')).toContainText('successfully');
    });

    test('should clear selected upload', async () => {
      await page.locator('.field-type.upload .file-details__remove').click();
    });

    test('should select using the list drawer and restrict mimetype based on filterOptions', async () => {
      await page.locator('.field-type.upload .upload__toggler.list-drawer__toggler').click();
      await wait(200);
      const jpgImages = await page.locator('[id^=list-drawer_1_] .upload-gallery img[src$=".jpg"]');
      expect(await jpgImages.count()).toEqual(0);
    });

    test.skip('should show drawer for input field when enableRichText is false', async () => {
      const uploads3URL = new AdminUrlUtil(serverURL, 'uploads3');
      await page.goto(uploads3URL.create);

      // create file in uploads 3 collection
      await page.locator('.file-field__upload input[type="file"]').setInputFiles(path.resolve(__dirname, './collections/Upload/payload.jpg'));
      await expect(page.locator('.file-field .file-field__filename')).toContainText('payload.jpg');
      await page.locator('#action-save').click();

      await wait(200);

      // open drawer
      await page.locator('.field-type.upload .list-drawer__toggler').click();
      // check title
      await expect(page.locator('.list-drawer__header-text')).toContainText('Uploads 3');
    });
  });

  describe('row', () => {
    let url: AdminUrlUtil;
    beforeAll(() => {
      url = new AdminUrlUtil(serverURL, 'row-fields');
    });

    test('should show row fields as table columns', async () => {
      await page.goto(url.create);

      // fill the required fields, including the row field
      const idInput = page.locator('input#field-id');
      await idInput.fill('123');
      const titleInput = page.locator('input#field-title');
      await titleInput.fill('Row 123');
      await page.locator('#action-save').click();
      await wait(200);
      await expect(page.locator('.Toastify')).toContainText('successfully');

      // ensure the 'title' field is visible in the table header
      await page.goto(url.list);
      const titleHeading = page.locator('th#heading-title');
      await expect(titleHeading).toBeVisible();

      // ensure the 'title' field shows the correct value in the table cell
      const titleCell = page.locator('.row-1 td.cell-title');
      await expect(titleCell).toBeVisible();
      await expect(titleCell).toContainText('Row 123');
    });

    test('should not show duplicative ID field', async () => {
      await page.goto(url.create);
      // fill the required fields, including the custom ID field
      const idInput = page.locator('input#field-id');
      await idInput.fill('456');
      const titleInput = page.locator('input#field-title');
      await titleInput.fill('Row 456');
      await page.locator('#action-save').click();
      await wait(200);
      await expect(page.locator('.Toastify')).toContainText('successfully');

      // ensure there are not two ID fields in the table header
      await page.goto(url.list);
      const idHeadings = page.locator('th#heading-id');
      await expect(idHeadings).toBeVisible();
      await expect(idHeadings).toHaveCount(1);
    });
  });

  describe('conditional logic', () => {
    let url: AdminUrlUtil;
    beforeAll(() => {
      url = new AdminUrlUtil(serverURL, 'conditional-logic');
    });

    test('should toggle conditional field when data changes', async () => {
      await page.goto(url.create);
      const toggleField = page.locator('label[for=field-toggleField]');
      await toggleField.click();

      const fieldToToggle = page.locator('input#field-fieldToToggle');

      await expect(fieldToToggle).toBeVisible();
    });

    test('should show conditionl field based on user data', async () => {
      await page.goto(url.create);
      const userConditional = page.locator('input#field-userConditional');
      await expect(userConditional).toBeVisible();
    });
  });
});
