"use client"
import styles from "./Home.module.css"
import { cookies } from "next/headers"

const Home = () => {
    return <main className={styles.main}>
        <h1>Whiteboard</h1>
        <br />

        <div className={styles.textbox}>
            <input 
                type="text" 
                placeholder="Username" 
                defaultValue={localStorage.getItem("username") || ""} 
                onChange={(e) => { localStorage.setItem("username", e.target.value) }}
            />
        </div>

        <a href="/draw"><button>Create room</button></a>

        <div className={styles.textbox}>
            <input type="text" placeholder="Room code"></input>
        </div>

        <button>Join room</button>

    </main>
}

export default Home;