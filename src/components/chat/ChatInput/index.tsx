"use client"
import { ChangeEvent, useEffect, useRef, useState } from "react";
import styles from "./ChatInput.module.css"

interface ChatInputProps {
    handleSubmit: Function
}

const ChatInput = (props: ChatInputProps) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [text, setText] = useState<string>("");

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLocaleLowerCase();

            if(inputRef.current === document.activeElement) {
                if(key == "escape") {
                    e.preventDefault();
                    inputRef.current?.blur();
                } else if (key == "enter") {
                    e.preventDefault();
                    inputRef.current?.blur();
                    props.handleSubmit(text);
                    setText("");
                }
            } else {
                if(key == "t") {
                    e.preventDefault();
                    inputRef.current?.focus();
                }
            }
            
            return;
        }

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        }
    }, [text])

    return <><input 
            id="chatbox-input"
            onChange={(e) => { setText(e.target.value) }}
            value={text}
            placeholder={"Press T to use the chat"}
            ref={inputRef} 
            className={styles.inputbox}>
        </input></>
}

export default ChatInput;