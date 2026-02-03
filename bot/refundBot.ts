import axios from "axios";
import { path } from "../config/path";
import { epochWeek } from '../config/limits';
import { revertEvent } from "../services/events/revert";


const refundBot = async () => {
    let config = {
        "select": ["*",
            { 'publicEvents/parcipiantsAnswer': ["*"] }
        ],
        "from": "publicEvents"
    }
    let data: any = await axios.post(`${path}/query`, config).catch((err) => {
        console.log(err);
        return;
    })

    if (data.data.length != 0) {
        let events = data.data.filter((x: any) => { return x['publicEvents/finalAnswerNumber'] == undefined && !x['publicEvents/status'].includes("reverted") })
        if (events.length != 0) {
            for (let i = 0; i < events.length; i++) {
                let eventId = events[i]["_id"]
                let endTime = events[i]["publicEvents/endTime"];
                let timeNow = Math.floor(new Date().getTime() / 1000.0)
                let week = epochWeek;
                if (timeNow - endTime > week) {
                    let participant = events[i]["publicEvents/parcipiantsAnswer"];
                    await revertEvent(eventId, participant, "not enough experts", undefined)
                };
            }
        }
    }
}

export {
    refundBot
}