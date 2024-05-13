import { ChatMsgVariant } from "@/types/enums"
import styles from "./ChatMsgComponent.module.css"

interface ChatMsgProps {
    variant: ChatMsgVariant
    timestamp: number
    user?: string | undefined
    content: string
}

const ChatMsgComponent = (props: ChatMsgProps) => {
    let displayClass: string = styles.msgInfo;

    switch (props.variant) {
        case ChatMsgVariant.SysInfo:
        case ChatMsgVariant.UserJoin:
        case ChatMsgVariant.UserLeave:
            break;
        
        case ChatMsgVariant.UserMsg:
            displayClass = styles.msgUser;
            break;

        case ChatMsgVariant.SysError:
            displayClass = styles.msgError;
            break;
        
        case ChatMsgVariant.SysWarning:
            displayClass = styles.msgWarning;
            break;
    }

    return <li data-timestamp={props.timestamp} className={`${displayClass} ${styles.msg}`}>
        { (props.variant == ChatMsgVariant.UserMsg && props.user) ? (
            <b>{props.user}: </b>
        ) : null}
        {props.content}
    </li>
}

export default ChatMsgComponent;