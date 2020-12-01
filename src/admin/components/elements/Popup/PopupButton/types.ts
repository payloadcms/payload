export type Props = {
    buttonType: 'custom' | 'default',
    button: React.ReactNode,
    setActive: (active: boolean) => void,
    active: boolean,
    onToggleOpen: (active: boolean) => void,
}
