import axios from 'axios';
import { path } from "../../config/path";
import { notificationStruct } from '../../structure/notification.struct';

const subscribeToNotification = async (req: any, res: any) => {
    let joinedId = req.body.joinedId;
    let subscribe = req.body.subscribe
    let config = [{
        "_id": Number(joinedId),
        "notifications": subscribe
    }]

    await axios.post(`${path}/transact`, config).catch((err: any) => {
        res.status(400);
        res.send(err.response.data.message);
        console.log("DB error: " + err.response.data.message)
        return;
    })

    res.status(200);
    res.send({ status: subscribe == true ? "Subscribed" : "Unsubscribed" });
}

const sendNotificationToUser = async (roomId: any, eventId: any, res: any) => {
    let sendData = [];
    let config = {
        "select": [{ "joinedUsers": ["*"] }],
        "from": Number(roomId),
    }

    let getData: any = await axios.post(`${path}/query`, config).catch((err: any) => {
        res.status(400);
        res.send(err.response.data.message);
        console.log("DB error: " + err.response.data.message)
        return;
    })
    if (getData.data[0].joinedUsers !== undefined) {

        for (let i = 0; i < getData.data[0].joinedUsers.length; i++) {
            let data = getData.data[0].joinedUsers[i];
            let notifications = data['joinRoom/notifications'];
            if (notifications) {
                sendData.push({
                    "_id": `notificationFromRoom$newNotification${i}`,
                    "joinRoomId": data["_id"],
                    "publicEventsId": Number(eventId),
                    "userId": data["joinRoom/userId"]["_id"],
                    "date": Math.floor(Date.now() / 1000),
                    "read": false
                }, {
                    "_id": data["joinRoom/userId"]["_id"],
                    "notificationFromRoom": [`notificationFromRoom$newNotification${i}`],
                })
            }
        }

        await axios.post(`${path}/transact`, sendData).catch((err: any) => {
            res.status(400);
            res.send(err.response.data.message);
            console.log("DB error: " + err.response.data.message)
            return;
        })
    }
}

const getNotificationByUserId = async (req: any, res: any) => {
    let userId = req.body.dataFromRedis.id;
    let config = {
        "select": [
            {
                "notificationFromRoom": ["*",
                    {
                        'notificationFromRoom/publicEventsId':
                            ['publicEvents/endTime',
                                { 'publicEvents/host': ["_id", "users/nickName", "users/avatar"] },
                                { 'publicEvents/room': ["_id"] }]
                    }]
            }
        ],
        "from": Number(userId),
        "opts": { "orderBy": ["DESC", "notificationFromRoom/date"] }
    }

    let getData: any = await axios.post(`${path}/query`, config).catch((err: any) => {
        res.status(400);
        res.send(err.response.data.message);
        console.log("DB error: " + err.response.data.message)
        return;
    })

    let data = getData.data[0].notificationFromRoom;

    if (data != undefined) {
        let notif = notificationStruct(data);
        res.status(200);
        res.send(notif);

    } else {
        res.status(200);
        res.send([]);
    }
}

const readNotification = async (req: any, res: any) => {
    let id = req.body.id;
    let data: any = [];
    id.forEach((x: any) => {
        data.push({
            "_id": x,
            "read": true
        })
    })

    await axios.post(`${path}/transact`, data).catch((err: any) => {
        res.status(400);
        res.send(err.response.data.message);
        console.log("DB error: " + err.response.data.message)
        return;
    })

    res.status(200);
    res.send({ status: "ok" });
}

const deleteNotifications = async (req: any, res: any) => {
    let id = req.body.id;
    let data: any = [];
    id.forEach((x: any) => {
        data.push({
            "_id": x,
            "_action": "delete"
        })
    })

    await axios.post(`${path}/transact`, data).catch((err: any) => {
        res.status(400);
        res.send(err.response.data.message);
        console.log("DB error: " + err.response.data.message)
        return;
    })

    res.status(200);
    res.send({ status: "ok" });
}

export {
    subscribeToNotification,
    sendNotificationToUser,
    getNotificationByUserId,
    readNotification,
    deleteNotifications
}
