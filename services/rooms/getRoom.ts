import axios from 'axios';
import { path } from "../../config/path";
import { roomStruct } from '../../structure/room.struct';

const getByUserId = async (req: any, res: any) => {
    let userId = req.body.dataFromRedis.id
    let getRooms = {
        "select": ["*", { "room/publicEventsId": ["publicEvents/status"], 'room/owner': ["users/nickName", "users/avatar"] }],
        "where": `room/owner = ${Number(userId)}`
    }

    let rooms: any = await axios.post(`${path}/query`, getRooms).catch(err => {
        res.status(400);
        res.send(err.response.data.message);
        console.log("DB error: " + err.response.data.message);
        return;
    })
    let obj = roomStruct(rooms.data)
    // filter rooms with private events
    let filterData = obj.filter((x: any) => { return x.publicEventsId.length != 0 })
    let data = sortRooms(filterData)
    res.status(200)
    res.send(data)

}

const getAllRooms = async (req: any, res: any) => {
    let getRooms = {
        "select": ["*", { "room/publicEventsId": ["publicEvents/status"], "room/owner": ["users/nickName", "users/avatar"] }],
        "from": "room"
    }

    let rooms: any = await axios.post(`${path}/query`, getRooms).catch(err => {
        res.status(400);
        res.send(err.response.data.message);
        console.log("DB error: " + err.response.data.message);
        return;
    })
    let obj = roomStruct(rooms.data);
    // filter rooms with private events    
    let filterData = obj.filter((x: any) => { return x.publicEventsId.length != 0 })
    let data = sortRooms(filterData)
    
    for (let i = 0; i < data.length; i++) {
        data[i].publicEventsId = data[i].publicEventsId.reverse();
    }
    res.status(200)
    res.send(data);

}

const roomValidation = async (req: any, res: any) => {
    let roomName = req.body.name;
    let userId = req.body.dataFromRedis.id

    let findRoom = {
        "select": ["*"],
        "where": `room/owner = ${Number(userId)}`
    }
    let rooms: any = await axios.post(`${path}/query`, findRoom).catch(err => {
        res.status(400);
        res.send(err.response.data.message);
        console.log("DB error: " + err.response.data.message)
        return;
    })
    if (rooms.data.length !== 0) {
        let findUser = rooms.data.find((x: any) => { return x['room/name'] == roomName })
        if (findUser !== undefined) {
            res.status(400);
            res.send({ message: "room with this name already exist" })
        } else {
            res.status(200);
            res.send({ message: "ok" })
        }
    } else {
        res.status(200);
        res.send({ message: "ok" })
    }
}

const getJoinedRoom = async (req: any, res: any) => {
    let id = req.body.dataFromRedis.id;
    let allRooms: any = [];
    let config = {
        "select": [{ "users/joinedRooms": [{ "joinRoom/roomId": ["*", { 'room/owner': ["*"] }] }] }],
        "from": Number(id)
    }

    let rooms: any = await axios.post(`${path}/query`, config).catch(err => {
        res.status(400);
        res.send(err.response.data.message);
        console.log("DB error: " + err.response.data.message)
        return;
    })

    if (rooms.data[0]['users/joinedRooms'] !== undefined) {
        rooms.data[0]['users/joinedRooms'].forEach((x: any) => {
            allRooms.push(x['joinRoom/roomId'])
        })

        let obj = roomStruct(allRooms);
        // filter rooms with private events
        let filterData = obj.filter((x: any) => { return x.publicEventsId.length != 0 })
        let data = sortRooms(filterData)
        res.status(200)
        res.send(data)
    } else {
        res.status(200);
        res.send([]);
    }
}

const getRoomColor = async (id: any) => {
    const config = {
        "select": ["room/roomColor"],
        "from": Number(id)
    }

    let data: any = await axios.post(`${path}/query`, config).catch(err => {
        console.log("err from get room color: " + err.response)
        return;
    })

    return data.data[0]["room/roomColor"]
}

const sortRooms = (rooms: any[]) => {
    rooms.sort((a:any, b:any) => {
        a.deployed = 0
        b.deployed = 0

        for (let value of a['publicEventsId']) {
            if (value["publicEvents/status"] == 'deployed') {
                a.deployed ++
            }
        }
        for (let value of b['publicEventsId']) {
            if (value["publicEvents/status"] == 'deployed') {
                b.deployed ++
            }
        }
        return b.deployed - a.deployed
    })
    return rooms
}


export {
    getByUserId,
    roomValidation,
    getAllRooms,
    getJoinedRoom,
    getRoomColor
}
