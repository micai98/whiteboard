import { Socket } from "socket.io-client";
import ChatInput from "../ChatInput";
import styles from "./ChatBox.module.css";
import { useEffect, useRef, useState } from "react";
import { ChatMsgVariant } from "@/types/enums";
import ChatMsgComponent from "../ChatMsgComponent";

interface ChatBoxProps {
    messages: Array<ChatMsg>
    handleSubmit: Function
}

const ChatBox = (props: ChatBoxProps) => {
    const ulRef = useRef<HTMLUListElement>(null);
    
    useEffect(() => {
        if(ulRef.current) ulRef.current.scrollTop = 1000000.0;
    }, [props.messages]);

    function chatPrint(text: string) {
        const msg: ChatMsg = {
            variant: ChatMsgVariant.SysInfo,
            timestamp: Date.now(),
            content: text
        }
    }

    return <div id="chatbox" className={styles.chatbox}>
        <ul className={styles.chatboxList} ref={ulRef}>
            { props.messages.map((message, index) => {
                return <ChatMsgComponent
                    key={message.timestamp + index}
                    variant={message.variant}
                    timestamp={message.timestamp}
                    user={message.user}
                    content={message.content}
                />
            })}
        </ul>
        <ChatInput handleSubmit={props.handleSubmit} />
    </div>
}

export default ChatBox;