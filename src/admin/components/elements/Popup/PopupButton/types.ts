export type Props = {
    buttonType: 'custom' | 'default' | 'none',
    button: React.ReactNode,
    setActive: (active: boolean) => void,
    active: boolean,
}
