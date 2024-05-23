import { MouseEventHandler } from "react"
import styles from "./MenuButton.module.css"

interface MenuButtonProps {
    text?: string
    icon?: JSX.Element
    onClick?: MouseEventHandler<HTMLButtonElement>
    className?: string
}

const MenuButton = (props: MenuButtonProps) => {
    const defaults: MenuButtonProps = {
        text: "",
        className: ""
    }
    props = { ...defaults, ...props }
    return <button
        className={`${styles.menuButton} ${props.className}`}
        onClick={props.onClick}
    >
        {props.icon ? props.icon : null}
        {props.text}
    </button>
}

export default MenuButton;