import NextLinkImport from 'next/link.js';
import React from 'react';
declare const NextLink: React.ForwardRefExoticComponent<Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof NextLinkImport.LinkProps<any>> & NextLinkImport.LinkProps<any> & {
    children?: React.ReactNode | undefined;
} & React.RefAttributes<HTMLAnchorElement>>;
type Props = {
    /**
     * Disable the e.preventDefault() call on click if you want to handle it yourself via onClick
     *
     * @default true
     */
    preventDefault?: boolean;
} & Parameters<typeof NextLink>[0];
export declare const Link: React.FC<Props>;
export {};
//# sourceMappingURL=index.d.ts.map