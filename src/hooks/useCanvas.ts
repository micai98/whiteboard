import { useEffect, useRef, useState } from "react"

export const useCanvas = (onDraw: ({ctx, curCoords, prevCoords}: Draw) => void, onMove: (coords: Coords) => void) => {
    const [mouseDown, setMouseDown] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const prevCoords = useRef<null | Coords>(null);
    const [ canvasCameraScale, setCanvasCameraScale ] = useState<number>(1.0);

    const onZoom = (ref: any) => {
        if(ref) setCanvasCameraScale(ref.state.scale);
    }

    const onMouseDown = (e: React.MouseEvent) => {
        if(e.button == 0) setMouseDown(true);
    }

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // initial render, paint the canvas with the default background color
    useEffect(() => {
        clearCanvas();
    }, [])

    // actual hook
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            const curCoords = getCoords(e);
            const ctx = canvasRef.current?.getContext("2d");
            if(!ctx || !curCoords) return;

            onMove(curCoords);
            if(mouseDown) onDraw({ctx, curCoords, prevCoords: prevCoords.current});
            prevCoords.current = curCoords;
        }

        const mouseDownHandler = (e: MouseEvent) => {
            const curCoords = getCoords(e);
            const ctx = canvasRef.current?.getContext("2d");
            if(!ctx || !curCoords) return;

            // this is here to make sure something gets drawn even if the user doesn't drag the mouse
            if(e.button == 0) onDraw({ctx, curCoords, prevCoords: prevCoords.current});
        }

        const mouseUpHandler = () => {
            setMouseDown(false);
            prevCoords.current = null;
        }

        const getCoords = (e: MouseEvent) => {
            const canvas = canvasRef.current;
            if(!canvas) return;

            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) / canvasCameraScale;
            const y = (e.clientY - rect.top) / canvasCameraScale;

            return {x, y}
        }

        
        canvasRef.current?.addEventListener("mousedown", mouseDownHandler);
        window.addEventListener("mousemove", handler);
        window.addEventListener("mouseup", mouseUpHandler);

        return () => { 
            canvasRef.current?.removeEventListener("mousedown", mouseDownHandler);
            window.removeEventListener("mousemove", handler);
            window.removeEventListener("mouseup", mouseUpHandler);
        }
    }, [onDraw]);

    return {canvasRef, onMouseDown, clearCanvas, setCanvasCameraScale}
}