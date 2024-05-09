"use client"
import { useEffect, useState } from "react";
import { BiPencil, BiEraser, BiTrash, BiPalette, BiMove, BiSolidEyedropper, BiMessageRoundedDetail } from "react-icons/bi";
import { TransformWrapper, TransformComponent, useTransformContext } from "react-zoom-pan-pinch";
import { SketchPicker } from "react-color";

import { useCanvas } from "@/hooks/useCanvas";
import { toHex } from "@/utils/toHex";
import { ChatMsgVariant, Tool } from "@/types/enums"
import { drawLine } from "@/utils/drawLine";
import ChatBox from "@/components/chat/ChatBox";
import ToolButton from "@/components/toolbar/ToolButton";
import socket from "../socket";
import { useRouter } from "next/navigation";
import Spinner from "@/components/ui/Spinner";

const Draw = () => {
    const router = useRouter()
    const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
    const [currentTool, setCurrentTool] = useState<number>(Tool.Pencil);
    const [color, setColor] = useState<string>("#000000");
    const [lineWidth, setLineWidth] = useState<number>(5);
    const { canvasRef, onMouseDown, clearCanvas, onZoom } = useCanvas(handleCanvasAction);
    const [cameraScale, setCameraScale] = useState<number>(1.0);

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [chatMessages, setChatMessages] = useState<Array<ChatMsg>>(new Array);
    const [roomName, setRoomName] = useState<string>("Offline")

    function handleCanvasAction({prevCoords, curCoords, ctx}: Draw) {
        if(currentTool == Tool.Pencil) {
            createLine({ctx, prevCoords, curCoords, color, lineWidth})
            return;
        }

        // no transparency support so an eraser is just a pencil that draws with the background color
        if(currentTool == Tool.Eraser) {
            createLine({ctx, prevCoords, curCoords, color: "#fff", lineWidth})
            return;
        }

        if(currentTool == Tool.ColorPicker) {
            const data = ctx.getImageData(curCoords.x, curCoords.y, 1, 1).data;
            const hex = "#" + toHex(data[0]) + toHex(data[1]) + toHex(data[2]);
            setColor(hex);
            return;
        }
    }

    function chatPrint(text: string | undefined, variant: ChatMsgVariant = ChatMsgVariant.SysInfo) {
        if (!text) return;

        const msg: ChatMsg = {
            variant: variant,
            content: text,
            timestamp: Date.now()
        }

        setChatMessages((prev) => [...prev, msg]);
    }

    // send commands from chat to the server. if there's no command prefix, automatically assume it's meant to be a chat message
    function chatHandleSubmit(text: string) {
        if(text.startsWith("/")) text = text.substring(1);
        else text = "say " + text;
        socket.emit("command", text);
    }

    function createLine({prevCoords, curCoords, ctx, color, lineWidth}: DrawLineProps) {
       drawLine({ctx, prevCoords, curCoords, color, lineWidth});
       // converting to a list to send less data
       socket.emit("draw_line", [prevCoords?.x, prevCoords?.y, curCoords?.x, curCoords?.y, color, lineWidth]);
    }

    function replicateLine(ctx: CanvasRenderingContext2D, data: Array<any>): DrawLineProps {
        return {
            ctx: ctx,
            prevCoords: {x: data[0], y: data[1]}, 
            curCoords: {x: data[2], y: data[3]},
            color: data[4],
            lineWidth: data[5]
        }
    }

    // establish connection
    useEffect(() => {
        socket.auth = {
            "user_name": localStorage.getItem("username")
        }
        socket.connect();

        return () => {
            socket.disconnect();
        }
    }, []);

    // connection
    useEffect(() => {
        const ctx = canvasRef.current?.getContext("2d");

        if(socket.id) setRoomName(socket.id);

        socket.emit("client_ready");

        socket.on("connect", () => {
            chatPrint("Connecting...");
            if(socket.id) setRoomName(socket.id);
            
        });

        socket.on("disconnect", () => {
            chatPrint("Lost connection to server", ChatMsgVariant.SysError);
            setRoomName("Offline");
        })

        socket.on("connect_response", (data: ConnectResponse) => {
            console.log(data);
            if(data.accepted) {
                chatPrint("Connected as " + data.username);
            } else {
                chatPrint("Server refused connection: " + data.message, ChatMsgVariant.SysError);
            }
            setIsLoading(false);
        });

        socket.on("canvas_request_state", () => {
            if(!canvasRef.current?.toDataURL()) return;
            socket.emit("canvas_state", canvasRef.current.toDataURL());
        });

        socket.on("canvas_receive_state", (state: string) => {
            console.log("Received state from server", state);
            const img = new Image()
            img.src = state;
            img.onload = () => {
                ctx?.drawImage(img, 0, 0);
            }
        });

        socket.on("canvas_clear", () => {
            clearCanvas();
        });

        socket.on("draw_line", (data: Array<any>) => {
            if(!ctx) return;
            drawLine(replicateLine(ctx, data));
            console.log(data);
        });

        socket.on("msg_broadcast", (data: ChatMsg) => {
            setChatMessages((prev) => [...prev, data]);
        });

        return () => {
            socket.off("connect");
            socket.off("connect_response");
            socket.off("disconnect");
            socket.off("client_ready");
            socket.off("canvas_request_state");
            socket.off("canvas_receive_state");
            socket.off("canvas_clear");
            socket.off("draw_line");
            socket.off("msg_broadcast");
        }
    }, [canvasRef, socket]);

    return (
        <>
            <div className="topbar">
                <div>
                    <ToolButton
                        label="Pencil"
                        icon={<BiPencil />}
                        pressed={currentTool == Tool.Pencil}
                        onClick={() => {setCurrentTool(Tool.Pencil) }}
                    />
                    <ToolButton
                        label="Eraser"
                        icon={<BiEraser />}
                        pressed={currentTool == Tool.Eraser}
                        onClick={() => {setCurrentTool(Tool.Eraser) }}
                    />
                    <ToolButton
                        label="Move Camera"
                        icon={<BiMove />}
                        pressed={currentTool == Tool.Camera}
                        onClick={() => {setCurrentTool(Tool.Camera) }}
                    />
                    <hr />
                    <ToolButton
                        label="Color"
                        icon={<BiPalette />}
                        pressed={showColorPicker}
                        onClick={() => { setShowColorPicker(!showColorPicker) }}
                        iconColor={color}
                    />
                    <ToolButton
                        label="Color Picker"
                        icon={<BiSolidEyedropper />}
                        pressed={currentTool == Tool.ColorPicker}
                        onClick={() => { setCurrentTool(Tool.ColorPicker) }}
                    /> 
                    <ToolButton 
                        label="Clear"
                        icon={<BiTrash />}
                        onClick={() => {socket.emit("command", "clear")}}
                    />
                    <hr />
                    <ToolButton
                        label="Send Message"
                        icon={<BiMessageRoundedDetail />}
                        onClick={() => { document.getElementById("chatbox-input")?.focus() }}
                    />
                    
                </div>
                <div className="roomname">
                    <p>{roomName}</p>
                </div>

            </div>

            { showColorPicker ? 
            <div className="topbar-colorpicker">
                Color
                <SketchPicker disableAlpha={false} color={color} onChange={(e) => setColor(e.hex)} />
                Line Width <br />
                <button onClick={() => {setLineWidth(2)}}>S</button>
                <button onClick={() => {setLineWidth(5)}}>M</button>
                <button onClick={() => {setLineWidth(8)}}>L</button>
                <button onClick={() => {setLineWidth(12)}}>XL</button>
                <button onClick={() => {setLineWidth(24)}}>XXL</button>
            </div>
            : null }

            {isLoading ? <div className="centerscreen"><Spinner size="6rem"/></div> : null}

            <TransformWrapper minScale={0.5} disabled={currentTool != Tool.Camera} onZoom={onZoom}>
                <TransformComponent>
                    <div id="drawingboard" onMouseDown={onMouseDown} hidden={isLoading}>
                        <canvas ref={canvasRef} className="centerscreen" width={800} height={600}>

                        </canvas>
                    </div>
                    
                </TransformComponent>
            </TransformWrapper>

            <div className="animate-fadein">
            <ChatBox messages={chatMessages} handleSubmit={chatHandleSubmit}/>
            </div>
        </>
    );
}

export default Draw