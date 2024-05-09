"use client"
import styles from "./Home.module.css"
import { cookies } from "next/headers"
import { setUserName, getUserName } from "./actions"

const Home = () => {
    return <main className={styles.main}>
        <h1>Whiteboard</h1>
        <br />

        <div className={styles.textbox}>
            <input type="text" placeholder="Username" onChange={(e) => {setUserName(e.target.value)}}></input>
        </div>

        <a href="/draw"><button>Create room</button></a>

        <div className={styles.textbox}>
            <input type="text" placeholder="Room code"></input>
        </div>

        <button>Join room</button>

    </main>
}

export default Home;