import { BiMessageRoundedEdit, BiSolidUserX } from 'react-icons/bi';
import styles from './RoomStatsUser.module.css'

interface RoomStatsUserProps {
    uid: number
    name: string
    buttonHandler: Function
    showKickButton: boolean
    showHost: boolean
    showYou: boolean
}

const RoomStatsUser = (props: RoomStatsUserProps) => {

    return <div className={styles.user}>
        <div className={styles.userId}>
            {props.uid}
        </div>

        <div className={styles.userName}>
            {props.name}
            {props.showHost ? (
                <span className={styles.userNameExtra}>(Host)</span>
            ) : null}
            {props.showYou ? (
                <span className={styles.userNameExtra}>(You)</span>
            ) : null}
            
        </div>

        <div className={styles.userButtons}>
            { props.showKickButton ? (
                <button
                    aria-label="Kick"
                    onClick={() => { props.buttonHandler(`kick ${props.uid}`) }}
                >
                    <BiSolidUserX />
                </button>
            ) : null }
        </div>
    </div>
}


export default RoomStatsUser;