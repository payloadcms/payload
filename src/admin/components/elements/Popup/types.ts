export type Props = {
    render: () => void,
    children: React.ReactNode,
    align: 'left' | 'center' | 'right',
    horizontalAlign: 'left' | 'center' | 'right',
    size: 'small' | 'large' | 'wide',
    color: 'light' | 'dark',
    buttonType: 'default' | 'custom',
    button: React.ReactNode,
    showOnHover: boolean,
    initActive: boolean,
    onToggleOpen: () => void,
}
