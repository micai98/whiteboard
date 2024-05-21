"use client"
import { MutableRefObject, RefObject, useEffect, useRef } from "react";
import { StateType } from "react-zoom-pan-pinch";
import socket from "@/app/socket";

interface CanvasPreviewProps {
    width: number
    height: number
    cameraState: StateType
    roomState: RoomState | undefined
    cameraStateRef: MutableRefObject<StateType | null>
    userStateRef: RefObject<UserStateRefType>
    lineWidth: number
}

const CanvasPreview = (props: CanvasPreviewProps) => {
    const previewRef = useRef<HTMLCanvasElement>(null);
    const remoteUserCoords = useRef<Map<number, Coords>>(new Map<number, Coords>);
    const remoteUserBrush = useRef<Map<number, [number, number]>>(new Map<number, [number, number]>);
    const localUserRef = useRef<Coords | null>(null);

    function drawUser(ctx: CanvasRenderingContext2D, coords: Coords, lineWidth: number, name: string = "") {
        ctx.beginPath();

        ctx.setLineDash([]);

        ctx.lineWidth = 2;
        ctx.textAlign = "center";
        ctx.font = "12px Sans-serif";
        ctx.strokeText(name, coords.x, coords.y+lineWidth+4)
        ctx.fillText(name, coords.x, coords.y+lineWidth+4);

        ctx.lineWidth = 1;

        ctx.strokeStyle = "#000";
        ctx.arc(coords.x, coords.y, lineWidth * 0.5, 0, 2 * Math.PI);
        ctx.stroke();

        ctx.setLineDash([2, 6]);
        ctx.strokeStyle = "#fff";
        ctx.arc(coords.x, coords.y, lineWidth * 0.5, 0, 2 * Math.PI);
        ctx.stroke();
    }

    function drawLocalUser(ctx: CanvasRenderingContext2D, rect:DOMRect) {
        if (ctx && rect && props.cameraStateRef.current && localUserRef.current) {
            const current = props.cameraStateRef.current

            const x = ((localUserRef.current.x - rect.left) / current.scale);
            const y = ((localUserRef.current.y - rect.top) / current.scale);

            drawUser(ctx, {x, y}, props.lineWidth);
        }
    }

    useEffect(() => {
        // Local User Preview
        const ctx = previewRef.current?.getContext("2d");

        const renderPreview = () => {
            const rect = previewRef.current?.getBoundingClientRect();
            if(!ctx || !rect) return;
            ctx.clearRect(0, 0, rect.width, rect.height);
            // drawing local user
            drawLocalUser(ctx, rect);
            if(props.roomState) {
                remoteUserCoords.current.forEach((data, uid) => {
                    const lineWidth = remoteUserBrush.current.get(uid)?.[0] || 5;
                    if(props.roomState?.users[uid]) drawUser(ctx, data, lineWidth, props.roomState.users[uid]);
                });
            }
        }

        const onMouseMove = (e: MouseEvent) => {
            localUserRef.current = {x: e.clientX, y: e.clientY}

            renderPreview();
        }

        window.addEventListener("mousemove", onMouseMove);

        socket.on("user_move", (data: Array<number>) => {
           remoteUserCoords.current?.set(data[0], {x: data[1], y: data[2]});
           renderPreview();
        });

        socket.on("user_width", (data: Array<number>) => {
            remoteUserBrush.current?.set(data[0], [data[1], 0]);
        });

        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            socket.off("user_move");
            socket.off("user_width");
        }

    }, [props.lineWidth, props.roomState])

    return <canvas ref={previewRef} className={"centerscreen animate-fadein no-pointer-events"} width={props.width} height={props.height}>

    </canvas>
}

export default CanvasPreview;