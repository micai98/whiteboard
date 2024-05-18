import { MouseEventHandler } from "react";
import RoomStatsUser from "../RoomStatsUser";
import styles from "./RoomStats.module.css"
import { BiX } from "react-icons/bi";

interface RoomStatsProps {
    closeButtonHandler: MouseEventHandler<HTMLButtonElement>
    userButtonHandler: Function
    roomInfo: RoomInfo | undefined
    roomState: RoomState | undefined
}

const RoomStats = (props: RoomStatsProps) => {
    const userlist = []

    if(props.roomState?.users && props.roomInfo) {
        const isClientHost = props.roomState.host == props.roomInfo.uid
        for(let user in props.roomState.users) {
            const uname = props.roomState.users[user]
            const uid = parseInt(user)
            userlist.push(
                <RoomStatsUser 
                    name={uname}
                    uid={uid} 
                    key={uid+237846} 
                    buttonHandler={props.userButtonHandler}
                    showKickButton={isClientHost && uid != props.roomInfo.uid}
                    showHost={uid == props.roomState.host}
                    showYou={uid == props.roomInfo.uid}
                />
            )
        }
    }

    return <div className={styles.roomStats}>
        <div className={styles.header}>
            <p>{props.roomInfo?.roomcode ? props.roomInfo?.roomcode : "Offline"}</p>
            <button className={styles.btnClose} onClick={props.closeButtonHandler}><BiX /></button>
        </div>
        <hr />
        <div className={styles.userList}>
            {userlist}
        </div>
    </div>
}

export default RoomStats;