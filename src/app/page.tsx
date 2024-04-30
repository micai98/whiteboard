"use client"
import { useCanvas } from "@/hooks/useCanvas";
import { BiPencil, BiEraser, BiTrash, BiPalette, BiMove, BiSolidEyedropper, BiMessageRoundedDetail } from "react-icons/bi";
import { TransformWrapper, TransformComponent, useTransformContext } from "react-zoom-pan-pinch";
import { SketchPicker } from "react-color";
import { MouseEventHandler, useEffect, useState } from "react";
import { toHex } from "@/utils/toHex";
import { io } from "socket.io-client";
import { Tool } from "@/types/enums"
import { drawLine } from "@/utils/drawLine";



const socket = io("http://localhost:3001");

const Home = () => {
    const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
    const [currentTool, setCurrentTool] = useState<number>(Tool.Pencil);
    const [color, setColor] = useState<string>("#000000");
    const [lineWidth, setLineWidth] = useState<number>(5);
    const { canvasRef, onMouseDown, clearCanvas, onZoom } = useCanvas(handleCanvasAction);
    const [cameraScale, setCameraScale] = useState<number>(1.0);

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

    useEffect(() => {
        const ctx = canvasRef.current?.getContext("2d");

        socket.on("draw_line", (data: Array<any>) => {
            if(!ctx) return;
            drawLine(replicateLine(ctx, data));
            console.log(data);
        })
    }, []);

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
                        onClick={clearCanvas}
                    />
                    <hr />
                    <ToolButton
                        label="Send Message"
                        icon={<BiMessageRoundedDetail />}
                    />
                    
                </div>
                <div className="roomname">
                    <p>Ujelsoft Paint Deluxe</p>
                </div>

            </div>

            { showColorPicker ? 
            <div className="topbar-colorpicker">
                Color
                <SketchPicker color={color} onChange={(e) => setColor(e.hex)} />
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

            <div id="chatbox">
                <ul>
                    <li><b>user: </b>test message1</li>
                    <li><b>resu: </b>1egassem tset</li>
                    <li><b>dad: </b>its bathtime</li>
                    
                </ul>
            </div>

        </>
    );
}

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

export default Home