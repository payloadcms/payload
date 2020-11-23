export type Props = {
    className: string,
    type: 'submit' | 'button',
    el: 'link' | 'anchor' | undefined,
    to: string,
    url: string,
    children: React.ReactNode,
    onClick: () => void,
    disabled: boolean,
    icon: React.ReactNode | ['chevron' | 'x' | 'plus'],
    iconStyle: 'with-border' | 'without-border' | 'none',
    buttonStyle: 'primary' | 'secondary' | 'transparent' | 'error' | 'none' | 'icon-label',
    round: boolean,
    size: 'small' | 'medium',
    iconPosition: 'left' | 'right'
}
