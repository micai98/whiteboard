"use client"
import { ChangeEvent, useEffect, useRef, useState } from "react"
import styles from "./Home.module.css"
import Link from "next/link";
import Spinner from "@/components/ui/Spinner";
import { validateUsername } from "@/utils/validateUsername";
import { useRouter, useSearchParams } from "next/navigation";

const Home = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [roomcode, setRoomcode] = useState<string>("");
    const [username, setUsername] = useState<string>("");
    const [errorText, setErrorText] = useState<string>("");

    const router = useRouter();
    const params = useSearchParams();

    useEffect(() => {
        setUsername(localStorage.getItem("username") || "");

        const err_name = params.get("err_name")
        if(err_name) {
            router.replace("/")
            setErrorText("You must set a username before joining a room.");
            setRoomcode(err_name);
        }

        setLoading(false);
    }, []);

    function onUsernameChange(e: ChangeEvent<HTMLInputElement>) {
        if (e.target.value.length > 23) {
            e.preventDefault();
        } else {
            setUsername(e.target.value);
            localStorage?.setItem("username", e.target.value);
        }
    }

    return <>
        {loading ? <main className="centerscreen"><Spinner size="6rem" /></main> : (
            <main className={styles.main + " animate-popup"}>
                <div className={styles.mainContent}>
                    <h1>Whiteboard</h1>
                    <br />

                    <form className={styles.mainContent}>
                        <div className={styles.textbox}>
                            <input
                                type="text"
                                placeholder="Username"
                                defaultValue={username}
                                value={username}
                                onChange={onUsernameChange}
                                required
                            />
                        </div>

                        <Link onClick={() => { setLoading(true) }} href="/draw" tabIndex={-1}>
                            <button
                                type={"submit"}
                                disabled={!validateUsername(username)}
                            >Create room</button>
                        </Link>

                        <div className={styles.textbox}>
                            <input
                                type="text"
                                placeholder="Room code"
                                value={roomcode}
                                onChange={(e) => { setRoomcode(e.target.value) }}
                            />
                        </div>

                        <Link href={"/draw?room=" + roomcode} tabIndex={-1}>
                            <button
                                onClick={() => { setLoading(true) }}
                                disabled={!validateUsername(username) || roomcode.length < 1}
                            >Join room</button>
                        </Link>
                    </form>
                </div>
                {errorText.length > 0 ? (
                    <div className={styles.mainError}>
                        {errorText}
                    </div>
                ) : (null)}
            </main>
        )}
    </>
}

export default Home;