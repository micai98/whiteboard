"use client"
import { useDraw } from "@/hooks/useDraw";
import { BiPencil, BiEraser, BiTrash, BiPalette, BiMove } from "react-icons/bi";
import { TransformWrapper, TransformComponent, useTransformContext } from "react-zoom-pan-pinch";
import { SketchPicker } from "react-color";
import { MouseEventHandler, useState } from "react";

enum Tool {
    Unknown = 0,
    Pencil = 1,
    Eraser = 2,
    Camera = 9,
}

const Home = () => {
    const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
    const [currentTool, setCurrentTool] = useState<number>(Tool.Pencil);
    const [color, setColor] = useState<string>("#000000aa");
    const [lineWidth, setLineWidth] = useState<number>(5);
    const { canvasRef, onMouseDown, clearCanvas, onZoom } = useDraw(drawLine);
    const [cameraScale, setCameraScale] = useState<number>(1.0);
    

    function drawLine({ ctx, curCoords, prevCoords }: Draw) {
        if(currentTool != Tool.Pencil && currentTool != Tool.Eraser) return;

        const { x: curX, y: curY } = curCoords;
        const lineColor = color;
        const halfWidth = lineWidth / 2;

        let startCoords = prevCoords ?? curCoords;

        if(currentTool == Tool.Eraser) {
            ctx.clearRect(startCoords.x - halfWidth, startCoords.y - halfWidth, lineWidth, lineWidth);
            ctx.clearRect(curCoords.x - halfWidth, curCoords.y - halfWidth, lineWidth, lineWidth);

            return;
        }

        ctx.beginPath();
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = lineColor;
        ctx.moveTo(startCoords.x, startCoords.y);
        ctx.lineTo(curX, curY);
        ctx.stroke();

        ctx.fillStyle = lineColor;
        ctx.beginPath();
        ctx.arc(startCoords.x, startCoords.y, lineWidth/2, 0, lineWidth/2 * Math.PI);
        ctx.fill();

    }

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
                    <ToolButton></ToolButton>
                    <ToolButton
                        label="Color"
                        icon={<BiPalette />}
                        pressed={showColorPicker}
                        onClick={() => { setShowColorPicker(!showColorPicker) }}
                    />
                    <ToolButton 
                        label="Clear"
                        icon={<BiTrash />}
                        onClick={clearCanvas}
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
                <button onClick={() => {setLineWidth(2)}}>Small</button>
                <button onClick={() => {setLineWidth(5)}}>Medium</button>
                <button onClick={() => {setLineWidth(8)}}>Big</button>
                <button onClick={() => {setLineWidth(12)}}>Huge</button>
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
}

const ToolButton = (props: ToolButtonProps) => {
    const defaults: ToolButtonProps = {
        pressed: false
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
            >
                {props.icon ? props.icon : null}
            </button>

            {props.children ? props.children : null}
        </div>
    )
}

export default Home