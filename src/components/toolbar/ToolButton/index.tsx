interface ToolButtonProps {
    children?: string | JSX.Element | JSX.Element[]
    label?: string
    icon?: JSX.Element
    onClick?: Function
    pressed?: boolean
    iconColor?: string
}

const ToolButton = (props: ToolButtonProps) => {
    const defaults: ToolButtonProps = {
        pressed: false,
        iconColor: "#fff"
    }
    props = { ...defaults, ...props }
    const handleClick = (e: React.MouseEvent) => {
        if (props.onClick) props.onClick(e);
    }

    return (
        <div>
            <button
                className="tool-button" type="button"
                onClick={handleClick}
                aria-pressed={props.pressed}
                aria-label={props.label}
                style={{color: props.iconColor}}
            >
                {props.icon ? props.icon : null}
            </button>

            {props.children ? props.children : null}
        </div>
    )
}

export default ToolButton;