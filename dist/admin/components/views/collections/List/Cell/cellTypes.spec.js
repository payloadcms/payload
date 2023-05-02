"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_2 = require("@testing-library/react");
const Blocks_1 = __importDefault(require("./field-types/Blocks"));
const Date_1 = __importDefault(require("./field-types/Date"));
const Checkbox_1 = __importDefault(require("./field-types/Checkbox"));
const Textarea_1 = __importDefault(require("./field-types/Textarea"));
const Select_1 = __importDefault(require("./field-types/Select"));
jest.mock('../../../../utilities/Config', () => ({
    useConfig: () => ({ admin: { dateFormat: 'MMMM do yyyy, h:mm a' } }),
}));
jest.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (string) => string }),
}));
describe('Cell Types', () => {
    describe('Blocks', () => {
        const field = {
            label: 'Blocks Content',
            name: 'blocks',
            labels: {
                singular: 'Block',
                plural: 'Blocks Content',
            },
            type: 'blocks',
            blocks: [
                {
                    slug: 'number',
                    labels: {
                        plural: 'Numbers',
                        singular: 'Number',
                    },
                    fields: [],
                },
            ],
        };
        it('renders multiple', () => {
            const data = [
                { blockType: 'number' },
                { blockType: 'number' },
            ];
            const { container } = (0, react_2.render)(react_1.default.createElement(Blocks_1.default, { data: data, field: field }));
            const el = container.querySelector('span');
            expect(el).toHaveTextContent('2 Blocks Content - Number, Number');
        });
        it('renders zero', () => {
            const data = [];
            const { container } = (0, react_2.render)(react_1.default.createElement(Blocks_1.default, { data: data, field: field }));
            const el = container.querySelector('span');
            expect(el).toHaveTextContent('0 Blocks Content');
        });
        it('renders "and X more" if over maximum of 5', () => {
            const data = [
                { blockType: 'number' },
                { blockType: 'number' },
                { blockType: 'number' },
                { blockType: 'number' },
                { blockType: 'number' },
                { blockType: 'number' },
            ];
            const { container } = (0, react_2.render)(react_1.default.createElement(Blocks_1.default, { data: data, field: field }));
            const el = container.querySelector('span');
            expect(el).toHaveTextContent('fields:itemsAndMore');
        });
    });
    describe('Date', () => {
        const field = {
            name: 'dayOnly',
            type: 'date',
            admin: {
                date: {
                    pickerAppearance: 'dayOnly',
                },
            },
        };
        it('renders date', () => {
            const timeStamp = '2020-10-06T14:07:39.033Z';
            const { container } = (0, react_2.render)(react_1.default.createElement(Date_1.default, { data: timeStamp, field: field }));
            const dateMatch = /October\s6th\s2020,\s[\d]{1,2}:07\s[A|P]M/; // Had to account for timezones in CI
            const el = container.querySelector('span');
            expect(el.textContent).toMatch(dateMatch);
        });
        it('handles undefined', () => {
            const timeStamp = undefined;
            const { container } = (0, react_2.render)(react_1.default.createElement(Date_1.default, { data: timeStamp, field: field }));
            const el = container.querySelector('span');
            expect(el.textContent).toBe('');
        });
    });
    describe('Checkbox', () => {
        it('renders true', () => {
            const { container } = (0, react_2.render)(react_1.default.createElement(Checkbox_1.default, { data: true }));
            const el = container.querySelector('span');
            expect(el).toHaveTextContent('true');
        });
        it('renders false', () => {
            const { container } = (0, react_2.render)(react_1.default.createElement(Checkbox_1.default, { data: false }));
            const el = container.querySelector('span');
            expect(el).toHaveTextContent('false');
        });
    });
    describe('Textarea', () => {
        it('renders data', () => {
            const { container } = (0, react_2.render)(react_1.default.createElement(Textarea_1.default, { data: "data" }));
            const el = container.querySelector('span');
            expect(el).toHaveTextContent('data');
        });
        it('handle undefined - bug/13', () => {
            const { container } = (0, react_2.render)(react_1.default.createElement(Textarea_1.default, { data: undefined }));
            const el = container.querySelector('span');
            expect(el).toHaveTextContent('');
        });
    });
    describe('Select', () => {
        const fieldWithOptionsObject = {
            type: 'select',
            name: 'selectObject',
            options: [{
                    value: 'one',
                    label: 'One',
                }, {
                    value: 'two',
                    label: 'Two',
                }],
        };
        const fieldWithStringsOptions = {
            type: 'select',
            name: 'selectString',
            options: ['blue', 'green', 'yellow'],
        };
        it('renders options objects', () => {
            const { container } = (0, react_2.render)(react_1.default.createElement(Select_1.default, { data: "one", field: fieldWithOptionsObject }));
            const el = container.querySelector('span');
            expect(el).toHaveTextContent('One');
        });
        it('renders option strings', () => {
            const { container } = (0, react_2.render)(react_1.default.createElement(Select_1.default, { data: "blue", field: fieldWithStringsOptions }));
            const el = container.querySelector('span');
            expect(el).toHaveTextContent('blue');
        });
        describe('HasMany', () => {
            it('renders options objects', () => {
                const { container } = (0, react_2.render)(react_1.default.createElement(Select_1.default, { data: ['one', 'two'], field: fieldWithOptionsObject }));
                const el = container.querySelector('span');
                expect(el).toHaveTextContent('One, Two');
            });
            it('renders option strings', () => {
                const { container } = (0, react_2.render)(react_1.default.createElement(Select_1.default, { data: ['blue', 'green'], field: fieldWithStringsOptions }));
                const el = container.querySelector('span');
                expect(el).toHaveTextContent('blue, green');
            });
        });
    });
});
//# sourceMappingURL=cellTypes.spec.js.map