"use client"
import { MouseEventHandler, useEffect, useRef, useState } from "react";
import { BiPencil, BiEraser, BiTrash, BiPalette, BiMove, BiSolidEyedropper, BiMessageRoundedDetail } from "react-icons/bi";
import { TransformWrapper, TransformComponent, useTransformContext } from "react-zoom-pan-pinch";
import { SketchPicker } from "react-color";
import { io } from "socket.io-client";

import { useCanvas } from "@/hooks/useCanvas";
import { toHex } from "@/utils/toHex";
import { ChatMsgVariant, Tool } from "@/types/enums"
import { drawLine } from "@/utils/drawLine";
import ChatInput from "@/components/chat/ChatInput";
import ChatBox from "@/components/chat/ChatBox";
import ToolButton from "@/components/toolbar/ToolButton";
import socket from "./socket";

const Home = () => {
    const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
    const [currentTool, setCurrentTool] = useState<number>(Tool.Pencil);
    const [color, setColor] = useState<string>("#000000");
    const [lineWidth, setLineWidth] = useState<number>(5);
    const { canvasRef, onMouseDown, clearCanvas, onZoom } = useCanvas(handleCanvasAction);
    const [cameraScale, setCameraScale] = useState<number>(1.0);

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

    function chatHandleSubmit(text: string) {
        socket.emit("msg_send", text);
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
            chatPrint("Connected to online room");
            if(socket.id) setRoomName(socket.id);
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
            socket.off("client_ready");
            socket.off("canvas_request_state");
            socket.off("canvas_received_state");
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
                        onClick={() => {socket.emit("vote_clear")}}
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


            <TransformWrapper minScale={0.5} disabled={currentTool != Tool.Camera} onZoom={onZoom}>
                <TransformComponent>
                    <div id="drawingboard" onMouseDown={onMouseDown}>
                        <canvas ref={canvasRef} width={640} height={480}>

                        </canvas>
                    </div>
                </TransformComponent>
            </TransformWrapper>

            <ChatBox messages={chatMessages} handleSubmit={chatHandleSubmit}/>

        </>
    );
}

export default Home