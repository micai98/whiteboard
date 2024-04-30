export function drawLine({ ctx, curCoords, prevCoords, color, lineWidth }: DrawLineProps) {
    const { x: curX, y: curY } = curCoords;
    let lineColor = color;
    const halfWidth = lineWidth / 2;

    let startCoords = prevCoords ?? curCoords;

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