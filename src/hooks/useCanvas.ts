import { useEffect, useRef, useState } from "react"

export const useCanvas = (onDraw: ({ctx, curCoords, prevCoords}: Draw) => void, onMove: (coords: Coords) => void) => {
    const [pointerDown, setPointerDown] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const prevCoords = useRef<null | Coords>(null);
    const [ canvasCameraScale, setCanvasCameraScale ] = useState<number>(1.0);

    const onZoom = (ref: any) => {
        if(ref) setCanvasCameraScale(ref.state.scale);
    }

    const getCoords = (e: PointerEvent) => {
        const canvas = canvasRef.current;
        if(!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / canvasCameraScale;
        const y = (e.clientY - rect.top) / canvasCameraScale;

        return {x, y}
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
        const handler = (e: PointerEvent) => {
            const curCoords = getCoords(e);
            const ctx = canvasRef.current?.getContext("2d");
            if(!ctx || !curCoords) return;

            onMove(curCoords);
            if(pointerDown) onDraw({ctx, curCoords, prevCoords: prevCoords.current});
            prevCoords.current = curCoords;
        }

        const pointerDownHandler = (e: PointerEvent) => {
            const curCoords = getCoords(e);
            const ctx = canvasRef.current?.getContext("2d");
            if(!ctx || !curCoords) return;

            
            if(e.button == 0) {
                prevCoords.current = curCoords;
                setPointerDown(true);
                // this is here to make drawing dots work (onMove is here to make the preview update correctly)
                onMove(curCoords);
                onDraw({ctx, curCoords, prevCoords: prevCoords.current});
            } 
        }

        const pointerUpHandler = () => {
            setPointerDown(false);
            prevCoords.current = null;
        }

        canvasRef.current?.addEventListener("pointerdown", pointerDownHandler);
        window.addEventListener("pointermove", handler);
        window.addEventListener("pointerup", pointerUpHandler);

        return () => { 
            canvasRef.current?.removeEventListener("pointerdown", pointerDownHandler);
            window.removeEventListener("pointermove", handler);
            window.removeEventListener("pointerup", pointerUpHandler);
        }
    }, [onDraw]);

    return {canvasRef, clearCanvas, setCanvasCameraScale}
}