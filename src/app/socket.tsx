import { io } from "socket.io-client"
const URL = process.env.NEXT_PUBLIC_BACKEND_ADDRESS || "http://localhost:3001";
const socket = io(URL, { autoConnect: false, multiplex: false});
export default socket;