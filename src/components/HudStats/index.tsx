"use client"
import { useEffect } from "react"
import styles from "./HudStats.module.css"

const HudStats = () => {
    useEffect(()=>{
        function handler() {

        }
        window.addEventListener("mousedown", handler);
        window.addEventListener("mousemove", handler);
        return () => {
            window.removeEventListener("mousedown", handler);
            window.removeEventListener("mousemove", handler);
        }
    }, [])

    return <div className={styles.hudstats}>
        Placeholder
    </div>
}

export default HudStats