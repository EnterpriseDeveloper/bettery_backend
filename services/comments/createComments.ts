import axios from "axios";
import {path} from "../../config/path";

const createComment = async (msg: any) => {
    if (msg.eventId !== undefined || msg.userId !== undefined || msg.comment !== undefined) {
        let type: any = await eventType(msg.eventId);

        let comments = [{
            _id: "comments$newComment",
            from: msg.userId,
            date: Math.floor(Date.now() / 1000),
            comment: msg.comment,
            [type]: msg.eventId
        }]
        await axios.post(`${path}/transact`, comments).catch(err => {
            console.log(err)
        })
    } else {
        console.log("structure data is incorrect from ");
    }
}

const replyToComment = async (msg: any) => {
    let eventId = msg.eventId;
    let commentId = msg.commentId;
    let userId = msg.userId;
    let text = msg.comment;
    let type: any = await eventType(msg.eventId);

    let comments = [{
        _id: "comments$newComment",
        from: userId,
        date: Math.floor(Date.now() / 1000),
        comment: text,
        [type]: eventId,
        reply: [commentId]
    }]
    await axios.post(`${path}/transact`, comments).catch(err => {
        console.log(err)
    })

}

const eventType = async (id: any) => {
    let conf = {
        "select": ["*"],
        "from": Number(id)
    }
    let getEvent = await axios.post(`${path}/query`, conf).catch(err => {
        console.log(err)
    })
    if (getEvent) {
        if (getEvent.data.length !== 0) {
            let eventText = JSON.stringify(getEvent.data)
            let eventIndex = eventText.search("privateEvents");
            return eventIndex == -1 ? "publicEventsId" : "privateEventsId"
        } else {
            console.log("event is undefined");
        }
    }
}

export {
    createComment,
    eventType,
    replyToComment
}
