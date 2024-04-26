import { MouseEventHandler, useEffect, useRef, useState } from "react"

export const useDraw = (onDraw: ({ctx, curCoords, prevCoords}: Draw) => void) => {
    const [mouseDown, setMouseDown] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const prevCoords = useRef<null | Coords>(null);
    const [ cameraScale, setCameraScale ] = useState<number>(1.0);

    const onZoom = (ref: any) => {
        if(ref) setCameraScale(ref.state.scale);
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
    }

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            const curCoords = getCoords(e);
            const ctx = canvasRef.current?.getContext("2d");
            if(!ctx || !curCoords) return;

            if(mouseDown) onDraw({ctx, curCoords, prevCoords: prevCoords.current});
            prevCoords.current = curCoords;
            console.log("camscale: " + cameraScale);

        }

        const mouseDownHandler = (e: MouseEvent) => {
            const curCoords = getCoords(e);
            const ctx = canvasRef.current?.getContext("2d");
            if(!ctx || !curCoords) return;

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
            const x = (e.clientX - rect.left) / cameraScale;
            const y = (e.clientY - rect.top) / cameraScale;

            return {x, y}
        }

        canvasRef.current?.addEventListener("mousedown", mouseDownHandler);
        window.addEventListener("mousemove", handler);
        window.addEventListener("mouseup", mouseUpHandler);

        return () => { 
            window.removeEventListener("mousemove", handler);
            canvasRef.current?.removeEventListener("mousedown", mouseDownHandler);
            window.removeEventListener("mouseup", mouseUpHandler);
        }
    }, [onDraw]);

    return {canvasRef, onMouseDown, clearCanvas, onZoom}
}