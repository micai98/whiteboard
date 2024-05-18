"use client"
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { BiPencil, BiEraser, BiTrash, BiPalette, BiMove, BiSolidEyedropper, BiMessageRoundedDetail, BiSolidUserDetail, BiSend, BiMenu } from "react-icons/bi";
import { TransformWrapper, TransformComponent, useTransformContext, ReactZoomPanPinchRef, StateType, ReactZoomPanPinchState } from "react-zoom-pan-pinch";
import { SketchPicker } from "react-color";

import { useCanvas } from "@/hooks/useCanvas";
import { toHex } from "@/utils/toHex";
import { ChatMsgVariant, Tool } from "@/types/enums"
import { drawLine } from "@/utils/drawLine";
import ChatBox from "@/components/chat/ChatBox";
import ToolButton from "@/components/toolbar/ToolButton";
import Spinner from "@/components/ui/Spinner";
import socket from "../socket";
import RoomStats from "@/components/room/RoomStats";
import CanvasPreview from "@/components/CanvasPreview";

const Draw = () => {
    const router = useRouter();
    const params = useSearchParams();

    const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
    const [showRoomStats, setShowRoomStats] = useState<boolean>(false);
    const [showChat, setShowChat] = useState<boolean>(true);
    const [showMenu, setShowMenu] = useState<boolean>(false);

    const [currentTool, setCurrentTool] = useState<number>(Tool.Pencil);
    const [color, setColor] = useState<string>("#000000");
    const [lineWidth, setLineWidth] = useState<number>(5);
    const { canvasRef, onMouseDown, clearCanvas, setCanvasCameraScale } = useCanvas(handleCanvasAction, handleCanvasMovement); // hook for the drawing canvas, i probably should've made it into a component :|


    const [ cameraState, setCameraState ] = useState<ReactZoomPanPinchState>({positionX: 0, positionY: 0, scale: 1.0, previousScale: 1.0});
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [chatMessages, setChatMessages] = useState<Array<ChatMsg>>(new Array);
    const [roomName, setRoomName] = useState<string>("Offline");
    const [roomInfo, setRoomInfo] = useState<RoomInfo>(); // received once, through "room_welcome" contains the room's code and the UID assigned to client by the server
    const [roomState, setRoomState] = useState<RoomState>(); // received every time the user list or room settings change. right now contains the current host's UID and a list of users
    const cameraStateRef = useRef<StateType | null>(null); // stores the viewport position and scale (zoom). used by the preview to display things correctly
    const userStateRef = useRef<UserStateRefType>(null);

    // used to change line width in both the actual canvas and preview, will try to come up with a cleaner solution later
    function changeLineWidth(width: number) {
        setLineWidth(width);
        socket.emit("user_width", width);
    }

    function handleCanvasMovement(coords: Coords) {
        socket.emit("user_move", [coords.x, coords.y]);
    }

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

    // handle viewport scale changing and forward the changes to the canvas components 
    function onCameraInit(ref: ReactZoomPanPinchRef) {
        cameraStateRef.current = ref.state;
    }

    function onCameraTransformed(ref: ReactZoomPanPinchRef, state: StateType) {
        cameraStateRef.current = state;
        setCanvasCameraScale(state.scale);
    }

    function onCamera(ref: ReactZoomPanPinchRef, event: TouchEvent | MouseEvent | WheelEvent) {
        setCameraState(ref.state);
        setCanvasCameraScale(ref.state.scale);
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
        if(text != "") {
            if(text.startsWith("/")) text = text.substring(1);
            else text = "say " + text;
            socket.emit("command", text);
        }
    }

    function createLine({prevCoords, curCoords, ctx, color, lineWidth}: DrawLineProps) {
       drawLine({ctx, prevCoords, curCoords, color, lineWidth});
       // converting to a list to send less data
       socket.emit("user_draw", [prevCoords?.x, prevCoords?.y, curCoords?.x, curCoords?.y, color, lineWidth]);
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
        const username: string | null = localStorage.getItem("username");
        if (!username) {
            chatPrint("Username not set - Returning to main menu");
            router.push("/");
        }
        socket.auth = {
            "user_name": username
        }
        socket.connect();

        return () => {
            socket.disconnect();
        }
    }, []);

    // connection
    useEffect(() => {
        const ctx = canvasRef.current?.getContext("2d");

        socket.on("connect", () => {
            let joinData: Object = {};
            const paramRoom: string | undefined = params.get("room")?.toUpperCase();
            if(paramRoom) {
                joinData = { room: paramRoom }
            } else {
                joinData = { create: "" }
            }
            socket.emit("client_join", joinData);
            //if(socket.id) setRoomName(socket.id);
        });

        socket.on("disconnect", () => {
            chatPrint("Lost connection to server", ChatMsgVariant.SysError);
            setRoomName("Offline");
            setIsLoading(true);
        })

        socket.on("connect_response", (data: ConnectResponse) => {
            console.log(data);
            if(data.accepted) {
                chatPrint("Connected to server");
            } else {
                chatPrint("Server refused connection: " + data.message, ChatMsgVariant.SysError);
            }
            
        });

        socket.on("canvas_request_state", () => {
            if(!canvasRef.current?.toDataURL()) return;
            socket.emit("canvas_state", canvasRef.current.toDataURL());
        });

        socket.on("canvas_receive_state", (state: string) => {
            console.log("Received state from server", state);
            if(state === "NEW_ROOM_EMPTY_CANVAS") {
                setIsLoading(false);
            } else {
                const img = new Image();
                img.src = state;
                img.onload = () => {
                    ctx?.drawImage(img, 0, 0);
                    setIsLoading(false);
                }
            }
        });

        socket.on("room_welcome", (data: RoomInfo) => {
            setRoomInfo(data);
            router.replace("/draw?room="+data.roomcode);
            chatPrint(`Connected to room ${data.roomcode}`);
        });

        socket.on("room_update", (data: RoomState) => {
            setRoomState(data);
        });

        socket.on("canvas_clear", () => {
            clearCanvas();
        });

        socket.on("user_draw", (data: Array<any>) => {
            if(!ctx) return;
            drawLine(replicateLine(ctx, data));
            console.log(data);
        });

        socket.on("user_move", (data: Array<number>) =>  {
            const prev = userStateRef.current?.get(data[0])
            // userStateRef.current?.set(data[0], {x: data[1], y:data[2]})
        });

        socket.on("msg_broadcast", (data: ChatMsg) => {
            setChatMessages((prev) => [...prev, data]);
        });

        return () => {
            socket.off("connect");
            socket.off("connect_response");
            socket.off("disconnect");
            socket.off("room_welcome");
            socket.off("room_update");
            socket.off("canvas_request_state");
            socket.off("canvas_receive_state");
            socket.off("canvas_clear");
            socket.off("user_draw");
            socket.off("user_move");
            socket.off("msg_broadcast");
        }
    }, [canvasRef, socket]);

    return (
        <>
            <div className="topbar">
                <div className="topbar-group">
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
                        label="Move camera"
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
                        label="Color picker"
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
                        label="Show chat"
                        icon={<BiMessageRoundedDetail />}
                        pressed={showChat}
                        onClick={() => { setShowChat(!showChat) }}
                    />
                    {/* <ToolButton
                        label="Send message"
                        icon={<BiSend />}
                        onClick={() => { document.getElementById("chatbox-input")?.focus() }}
                    /> */}
                    <ToolButton
                        label="Show room statistics"
                        icon={<BiSolidUserDetail />}
                        pressed={showRoomStats}
                        onClick={() => { setShowRoomStats(!showRoomStats) }}
                    />
                </div>
                <div className="topbar-group">
                    <div className="topbar-roomdetails">
                        <p>{roomInfo?.roomcode ? roomInfo.roomcode : "Offline"}</p>
                        {roomState?.usercount ? (
                            <p className="topbar-roomdetails-online">{roomState.usercount} user{ roomState.usercount > 1 ? ("s") : null }</p>
                        ) : null}
                    </div>
                    
                    <ToolButton
                        label="Menu"
                        icon={<BiMenu />}
                        pressed={showMenu}
                        onClick={() => { setShowMenu(!showMenu) }}
                    />
                </div>

            </div>

            { showColorPicker ? 
            <div className="topbar-colorpicker animate-fadein">
                Color
                <SketchPicker disableAlpha={false} color={color} onChange={(e) => setColor(e.hex)} />
                Line Width <br />
                <button onClick={() => {changeLineWidth(2)}}>2</button>
                <button onClick={() => {changeLineWidth(5)}}>5</button>
                <button onClick={() => {changeLineWidth(8)}}>8</button>
                <button onClick={() => {changeLineWidth(12)}}>12</button>
                <button onClick={() => {changeLineWidth(24)}}>24</button>
            </div>
            : null }

            { showMenu ? 
            <div className="topbar-menu animate-fadein">
                {roomInfo?.uid == roomState?.host ? 
                    <button onClick={() => {socket.emit("command", "forceclear")}}>Force clear</button> 
                : null}
                
                <button onClick={() => {router.push("/")}}>Quit</button>
            </div>
            : null }

            {isLoading ? <div className="centerscreen"><Spinner size="6rem"/></div> : null}

            <TransformWrapper 
                minScale={0.5} 
                disabled={currentTool != Tool.Camera} 
                onTransformed={onCameraTransformed}
                onInit={onCameraInit}
            >
                <TransformComponent>
                    <div id="drawingboard" onMouseDown={onMouseDown} hidden={isLoading}>
                        <canvas ref={canvasRef} className="centerscreen animate-fadein" width={800} height={600}></canvas>
                        <CanvasPreview 
                            width={800}
                            height={600}
                            cameraStateRef={cameraStateRef}
                            cameraState={cameraState}
                            roomState={roomState}
                            userStateRef={userStateRef}
                            lineWidth={lineWidth}
                        />
                    </div>
                    
                </TransformComponent>
            </TransformWrapper>

            <div className="animate-fadein" hidden={!showChat}>
                <ChatBox messages={chatMessages} handleSubmit={chatHandleSubmit}/>
            </div>

            <div className="animate-fadein" hidden={!(showRoomStats && socket.connected)}>
                <RoomStats 
                    closeButtonHandler={() => {setShowRoomStats(false)}}
                    roomState={roomState}
                    roomInfo={roomInfo}
                    userButtonHandler={(command:string) => {socket.emit("command", command)}}
                />
            </div>
        </>
    );
}

export default Draw