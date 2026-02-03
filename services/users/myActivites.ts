import axios from "axios";
import { path } from "../../config/path";
import { publicEventStructure } from '../../structure/event.struct';
import { searchData } from '../../helpers/filter';
import { getAdditionalData, getAnswers } from '../../helpers/additionalData';

const getAllUserEvents = async (req: any, res: any) => {
    let eventData: any[] = [];
    let from = req.body.from;
    let to = req.body.to;
    let search = req.body.search != undefined ? req.body.search : '';
    let userId = req.body.userId;
    let finished = req.body.finished;

    let config = {
        select: [
            {
                "users/publicActivites": [{
                    'publicActivites/eventId': ["*",
                        { 'publicEvents/parcipiantsAnswer': ["*", { "publicActivites/from": ['users/avatar'] }] },
                        { 'publicEvents/validatorsAnswer': ["*", { "publicActivites/from": ['users/avatar'] }] },
                        { 'publicEvents/host': ["users/nickName", 'users/avatar', 'users/wallet'] },
                        { 'publicEvents/room': ["room/name", 'room/color', 'room/owner', 'room/publicEventsId'] }
                    ]
                }]
            },
            {
                "users/hostPublicEvents": ["*",
                    { 'publicEvents/parcipiantsAnswer': ["*", { "publicActivites/from": ['users/avatar'] }] },
                    { 'publicEvents/validatorsAnswer': ["*", { "publicActivites/from": ['users/avatar'] }] },
                    { 'publicEvents/host': ["users/nickName", 'users/avatar', 'users/wallet'] },
                    { 'publicEvents/room': ["room/name", 'room/color', 'room/owner', 'room/publicEventsId'] }
                ]
            }
        ],
        from: userId
    }

    let allData: any = await axios.post(path + "/query", config).catch((err) => {
        console.log(err)
        res.status(400);
        res.send(err.response.data.message);
    })
    let data = allData.data[0];
    if (data['users/publicActivites'] == undefined && data['users/hostPublicEvents'] == undefined) {
        res.status(200);
        res.send({
            allAmountEvents: 0,
            amount: 0,
            events: []
        });
    } else {
        if (data['users/publicActivites'] != undefined) {
            data['users/publicActivites'].forEach((x: any) => {
                if (x['publicActivites/eventId'] != undefined) {
                    eventData.push(x['publicActivites/eventId']);
                }
            })
        }
        if (data['users/hostPublicEvents'] != undefined) {
            data['users/hostPublicEvents'].forEach((x: any) => {
                eventData.push(x);
            })
        }

        let unique = eventData.filter((v, i, a) => a.findIndex(t => (t._id === v._id)) === i)
        let obj = publicEventStructure(unique);
        let dataEvetns = search.length >= 1 ? searchData(obj, search) : obj;
        if (!finished) {
            dataEvetns = dataEvetns.filter((e: any) => { return e.finalAnswer === null })
        }
        let eventsAddit = await getAdditionalData(dataEvetns.slice(from, to), res)

        for (let i = 0; i < eventsAddit.length; i++) {
            eventsAddit[i].usersAnswers = getAnswers(eventsAddit[i], userId);
        }
        let events = {
            allAmountEvents: obj.length,
            amount: dataEvetns.length,
            events: eventsAddit
        }
        res.status(200)
        res.send(events)
    }
}

export {
    getAllUserEvents
}

