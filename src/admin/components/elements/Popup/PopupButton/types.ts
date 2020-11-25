export type Props = {
    buttonType: 'custom' | 'default',
    button: React.ReactNode,
    setActive: () => void,
    active: boolean,
    onToggleOpen: () => void,
}
