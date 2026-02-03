import axios from 'axios';
import { path } from '../../config/path';
import { publicEventStructure } from '../../structure/event.struct';
import { searchData } from '../../helpers/filter';
import {getAdditionalData, getAnswers} from "../../helpers/additionalData";

const getEventByRoomId = async (req: any, res: any) => {
    let id = req.body.id;
    let from = req.body.from;
    let to = req.body.to;
    let search = req.body.search != undefined ? req.body.search : '';
    let userId = req.body.userId

    let eventData = await getData(id, res);

    if (eventData !== undefined) {

        let roomEvent = publicEventStructure(eventData.data);
        let dataEvetns = search.length >= 1 ? searchData(roomEvent, search) : roomEvent;
        let eventsAddit = await getAdditionalData(dataEvetns.slice(from, to), res)

        for (let i = 0; i < eventsAddit.length; i++) {
            eventsAddit[i].usersAnswers = getAnswers(eventsAddit[i], userId);
        }
        let events = {
            allAmountEvents: roomEvent.length,
            amount: dataEvetns.length,
            events: eventsAddit
        }
        res.status(200)
        res.send(events)
    }
}

const roomInfo = async (req: any, res: any) => {
    let roomId = req.body.roomId;
    let userId = req.body.userId;
    let eventData = await getData(roomId, res);
    let hostData = await getHostData(roomId, res);

    let joined = findJoined(userId, hostData[0]['room/joinedUsers'])

    if (eventData !== undefined) {
        let room = {
            name: eventData.data[0]["publicEvents/room"][0]["room/name"],
            color: eventData.data[0]["publicEvents/room"][0]["room/color"],
            hostId: hostData[0]['room/owner']['_id'],
            host: hostData[0]['room/owner']['users/nickName'],
            hostAvatar: hostData[0]['room/owner']['users/avatar'],
            events: eventData.data.length,
            activeEvents: getActiveEvents(eventData.data),
            members: hostData[0]['room/joinedUsers'] == undefined ? 0 : hostData[0]['room/joinedUsers'].length,
            joined: joined == undefined ? false : true,
            notifications: joined == undefined ? undefined : joined['joinRoom/notifications'],
            joinedId: joined == undefined ? undefined : joined["_id"]
        }
        res.status(200);
        res.send(room);
    }
}

const findJoined = (userId: any, data: any) => {
    if (data) {
        return data.find((x: any) => { return x['joinRoom/userId']["_id"] == userId });
    } else {
        return undefined;
    }
}

const getActiveEvents = (data: any) => {
    let events = data.filter((x: any) => {
        return x['publicEvents/finalAnswerNumber'] == undefined && x['publicEvents/status'].search("reverted") == -1
    })
    return events.length;
}

const getHostData = async (id: any, res: any) => {
    let host = {
        "select": ["*",
            {
                "room/joinedUsers": ["*"],
                "room/owner": ["*"]
            }
        ],
        "from": id,
    }

    const hostData: any = await axios.post(`${path}/query`, host).catch((err: any) => {
        res.status(404);
        res.send({ message: err });
        return undefined;
    })

    return hostData.data;

}

const getData = async (id: any, res: any) => {
    // TODO symplify query
    let event = {
        "select": ["*",
            { 'publicEvents/parcipiantsAnswer': ["*",{"_as": "publicEvents/parcipiantsAnswer", "_limit": 1000}, { "publicActivites/from": ["*"] }] },
            { 'publicEvents/validatorsAnswer': ["*", { "publicActivites/from": ["*"] }] },
            { 'publicEvents/host': ["*"] },
            { 'publicEvents/room': ["*"] }
        ],
        "where": `publicEvents/room = ${Number(id)}`,
        "opts": { "orderBy": ["DESC", "publicEvents/startTime"] }
    }

    const eventData = await axios.post(`${path}/query`, event).catch((err: any) => {
        res.status(404);
        res.send({ message: err });
        return undefined;
    })
    return eventData;
}

export {
    getEventByRoomId,
    roomInfo
}
