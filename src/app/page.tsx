"use client"
import { useState } from "react"
import styles from "./Home.module.css"
import Link from "next/link";

const Home = () => {
    const [ roomcode, setRoomcode ] = useState<string>("");

    return <main className={styles.main + " animate-popup"}>
        <h1>Whiteboard</h1>
        <br />

        <div className={styles.textbox}>
            <input 
                type="text" 
                placeholder="Username" 
                defaultValue={localStorage?.getItem("username") || ""} 
                onChange={(e) => { localStorage?.setItem("username", e.target.value) }}
            />
        </div>

        <Link href="/draw">
            <button>Create room</button>
        </Link>

        <div className={styles.textbox}>
            <input
                type="text" 
                placeholder="Room code"
                onChange={(e) => {setRoomcode(e.target.value)}}
            />
        </div>

        <Link href={"/draw?room=" + roomcode}>
            <button>Join room</button>
        </Link>

    </main>
}

export default Home;