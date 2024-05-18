

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
type ConnectResponse = {
    accepted: boolean
    message: string
    username: string | undefined
}

type RoomInfo = {
    roomcode: uid
    uid: number
}

type RoomState = {
    host: number
    users: Object<any>
    usercount: number
}

type UserStateRefType = Map<number,[Coords, number]>



type Coords = { x: number; y: number }