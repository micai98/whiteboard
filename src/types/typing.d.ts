type Draw = {
    ctx: CanvasRenderingContext2D
    curCoords: Coords
    prevCoords: Coords | null
}

type DrawLineProps = Draw & {
    color: string
    lineWidth: number
}

type Coords = { x: number; y: number }