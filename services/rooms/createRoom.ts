import axios from 'axios';
import {path} from "../../config/path";

const createRoom = (data: any, type: any) => {
    const date = Math.floor(Date.now() / 1000)
    return {
        _id: "room$newRoom",
        [type]: [data._id],
        name: data.roomName,
        image: data.roomImage,
        color: data.roomColor,
        owner: data.host,
        dateCreation: date
    }
}

const joinToRoom = async (req: any, res: any) => {
    let userId = req.body.dataFromRedis.id;
    let roomId = req.body.roomId;
    let config = [{
        '_id': "joinRoom$newJoin",
        "date": Math.floor(Date.now() / 1000),
        "notifications": true,
        "userId": Number(userId),
        "roomId": Number(roomId)
    }, {
        "_id": Number(userId),
        "joinedRooms": ["joinRoom$newJoin"]
    }, {
        "_id": Number(roomId),
        "joinedUsers": ["joinRoom$newJoin"]
    }]
    await axios.post(`${path}/transact`, config).catch((err) => {
        res.status(400);
        res.send(err.response.data.message);
        console.log("DB error: " + err.response.data.message)
        return;
    })

    res.status(200);
    res.send({ status: "ok" });
}

const leaveRoom = async (req: any, res: any) => {
    let joinedId = req.body.joinedId;
    let config = [{
        "_id": Number(joinedId),
        "_action": "delete"
    }]

    await axios.post(`${path}/transact`, config).catch((err) => {
        res.status(400);
        res.send(err.response.data.message);
        console.log("DB error: " + err.response.data.message)
        return;
    })

    res.status(200);
    res.send({ status: "deleted" });
}


export {
    createRoom,
    joinToRoom,
    leaveRoom
}
