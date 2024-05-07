

type Draw = {
    ctx: CanvasRenderingContext2D
    curCoords: Coords
    prevCoords: Coords | null
}

type DrawLineProps = Draw & {
    color: string
    lineWidth: number
}

type ChatMsg = {
    variant: ChatMsgVariant
    timestamp: number
    user?: string | undefined
    content: string
}

type Coords = { x: number; y: number }