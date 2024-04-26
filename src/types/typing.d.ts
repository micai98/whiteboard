type Draw = {
    ctx: CanvasRenderingContext2D
    curCoords: Coords
    prevCoords: Coords | null
}

type Coords = { x: number; y: number }