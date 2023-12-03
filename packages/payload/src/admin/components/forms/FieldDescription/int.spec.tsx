import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import FieldDescription from "./index";
import {Props} from "./types";

jest.mock('react-i18next', () => ({
    useTranslation: () => ({ i18n: { language: 'en' } }),
}));

describe('FieldDescription', () => {
    it('renders correctly with a string description', () => {
        const props: Props = {
            className: 'custom-class',
            path: 'fieldPath',
            description: 'This is a description',
            value: 'fieldValue',
        };

        const { container } = render(<FieldDescription {...props} />);
        expect(screen.getByText('This is a description')).toBeInTheDocument();
        expect(container.firstChild).toHaveClass('custom-class');
    });

    it('renders baseClass and margin placement correctly with a string description', () => {
        const props: Props = {
            className: 'custom-class',
            path: 'fieldPath',
            description: 'This is a description',
            value: 'fieldValue',
            marginPlacement: 'top',
        };

        const { container } = render(<FieldDescription {...props} />);
        expect(container.firstChild).toHaveClass('field-description', 'field-description--margin-top');
    });

    it('renders correctly with a component description', () => {
        const CustomComponent = ({ path, value }) => (
            <div>
                Custom Component: {path} - {value}
            </div>
        );

        const props: Props = {
            className: 'custom-class',
            path: 'fieldPath',
            description: CustomComponent,
            value: 'fieldValue',
        };

        render(<FieldDescription {...props} />);
        expect(screen.getByText(/Custom Component: fieldPath - fieldValue/)).toBeInTheDocument();
    });

    it('renders correctly when description is a function', () => {
        const descriptionFunction = ({ path, value }) => `Function Description: ${path} - ${value}`;

        const props: Props = {
            className: 'custom-class',
            path: 'fieldPath',
            description: descriptionFunction,
            value: 'fieldValue',
        };

        const { container } = render(<FieldDescription {...props} />);
        expect(screen.getByText(/Function Description: fieldPath - fieldValue/)).toBeInTheDocument();
    });

    it('renders nothing when description is not provided', () => {
        const props: Props = {
            path: 'fieldPath',
            value: 'fieldValue',
        };

        const { container } = render(<FieldDescription {...props} />);
        expect(container).toBeEmptyDOMElement();
    });
});
