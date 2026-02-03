import axios from "axios";
import { path, demonAPI } from "../config/path";
import { balanceCheck } from "../services/funds/userTokens";

const usersAmount = async (req: any, res: any) => {
    let params: any = {
        select: ["_id", 'isBot'],
        from: "users"
    }

    let data: any = await axios.post(`${path}/query`, params).catch((err) => {
        res.status(400)
        res.send(`Error from DB: ${err.response.statusText}`)
        return
    })

    if (data.data.length) {
        let pureDate = data.data.filter((el: any) => {
            return el.isBot == undefined
        })
        res.status(200)
        res.send({ amount: pureDate.length })
    } else {
        res.status(400)
        res.send(`no users`)
    }
}

const analytics24h = async (req: any, res: any) => {
    const { date } = req.body

    let time = new Date(date).setHours(0, 0, 0, 0) / 1000
    let day = 86400

    let params: any = {
        publicData: {
            "select": ["publicEvents/dateCreation", {
                "publicEvents/parcipiantsAnswer": [
                    { "publicActivites/from": ["users/isBot"] }
                ]
            }, {
                    "publicEvents/validatorsAnswer": [
                        { "publicActivites/from": ["users/isBot"] }
                    ]
                }, "publicEvents/status", "publicEvents/mintedTokens"],
            "where": `publicEvents/dateCreation > ${time}`
        },
        privateData: {
            "select": ["privateEvents/dateCreation", {
                "privateEvents/parcipiantsAnswer": [
                    { "privateActivites/from": ["users/isBot"] }
                ]
            }, {
                    "privateEvents/validatorsAnswer": [
                        { "privateActivites/from": ["users/isBot"] }
                    ]
                }, "privateEvents/status", "privateEvents/mintedTokens"],
            "from": "privateEvents"
        },
        usersData: {
            select: ["_id", "isBot", "registered"],
            from: "users"
        },
        roomData: {
            "select": [{
                "room/publicEventsId": ["publicEvents/dateCreation"]
            }, {
                "room/privateEventsId": ["privateEvents/dateCreation"]
            }, "room/dateCreation"],
            "from": "room"
        }
    }

    let { data: { publicData, privateData, usersData, roomData }}: any = await axios.post(`${path}/multi-query`, params).catch((err) => {
        res.status(400)
        res.send(`Error from DB: ${err.response.statusText}`)
        return
    })

    let userPureDate = usersData.filter((el: any) => {
        return el.isBot == undefined && el.registered && el.registered > (time) && el.registered < time + day
    })

    let pureData = publicData.filter((el: any) => {
        return el['publicEvents/dateCreation'] < time + day
    })
    
    let privatePureData = privateData.filter((el: any) => {
        return el['privateEvents/dateCreation'] < time + day && el['privateEvents/dateCreation'] > time
    })

    let { parc, val, finished, cancel, mintTokens } = await letsFindRealUsers(pureData, 'public')
    let privateEventData = await letsFindRealUsers(privatePureData, 'private')
    let { privateRoom, publicRoom } = filterRooms(roomData, time, day)

    res.status(200)
    res.send({
        newUser: userPureDate.length,
        publicEvents_Created: pureData.length,
        publicEvent_Parcipiants: parc.length,
        publicEvent_Validators: val.length,
        publicEvents_Finalized: finished.length,
        publicEvents_Cancelled: cancel.length,
        publicEvent_TokensMinted: mintTokens,
        publicRooms_Created: publicRoom.length,
        privateEvents_Created: privatePureData.length,
        privateEvent_Parcipiants: privateEventData.parc.length,
        privateEvent_Validators: privateEventData.val.length,
        privateEvents_Finalized: privateEventData.finished.length,
        privateEvents_Cancelled: privateEventData.cancel.length,
        privateEvent_TokensMinted: privateEventData.mintTokens,
        privateRooms_Created: privateRoom.length
    })

}

let letsFindRealUsers = async (pureData: any, state: string) => {
    let parc: any = []
    let val: any = []
    let finished: any = []
    let cancel: any = []
    let mintTokens = 0

    for (let i = 0; i < pureData.length; i++) {
        if (pureData[i][`${state}Events/parcipiantsAnswer`] != undefined) {
            pureData[i][`${state}Events/parcipiantsAnswer`].map((el: any) => {

                if (!el[`${state}Activites/from`]['users/isBot']) {
                    parc.push(el[`${state}Activites/from`]._id)
                }
            })
        }
        if (pureData[i][`${state}Events/validatorsAnswer`] != undefined) {
            pureData[i][`${state}Events/validatorsAnswer`].map((el: any) => {

                if (!el[`${state}Activites/from`]['users/isBot']) {
                    val.push(el[`${state}Activites/from`]._id)
                }
            })
        }

        if (pureData[i][`${state}Events/status`] === 'cancel') {
            cancel.push(pureData[i])
        }
        if (pureData[i][`${state}Events/status`] === 'finished') {
            finished.push(pureData[i])
        }

        if (pureData[i][`${state}Events/mintedTokens`]) {
            mintTokens = mintTokens + pureData[i][`${state}Events/mintedTokens`]
        }
    }
    parc = unique(parc)
    val = unique(val)

    return { parc, val, finished, cancel, mintTokens }
}

let unique = (arr: any) => {
    let result: any = [];

    for (let str of arr) {
        if (!result.includes(str)) {
            result.push(str);
        }
    }
    return result;
}

const filterRooms = (roomData: any, time: number, day: number) => {
    const publicRoom: any = [];
    const privateRoom: any = [];

    for (let room of roomData){
        if (room["room/publicEventsId"] && !room["room/privateEventsId"]){
            if (room["room/dateCreation"] && room["room/dateCreation"] > time && room["room/dateCreation"] < time + day) {
                publicRoom.push(room)
            } else if (!room["room/dateCreation"] 
            && room["room/publicEventsId"][0]["publicEvents/dateCreation"] > time
            && room["room/publicEventsId"][0]["publicEvents/dateCreation"] < time + day){
                publicRoom.push(room)
            }
        }

        if (room["room/privateEventsId"] && !room["room/publicEventsId"]) {
            if (room["room/dateCreation"] && room["room/dateCreation"] > time && room["room/dateCreation"] < time + day){
                privateRoom.push(room)
            } else if (!room["room/dateCreation"] 
            && room["room/privateEventsId"][0]["privateEvents/dateCreation"] > time
            && room["room/privateEventsId"][0]["privateEvents/dateCreation"] < time + day){
                privateRoom.push(room)
            }
        }
    }
    return {
        privateRoom,
        publicRoom
    };
}

const analyticsByEventId = async (req: any, res: any) => {
    let eventId = req.body.id

    let params = {
        "select": ["publicEvents/status", {
            "publicEvents/parcipiantsAnswer": [
                { "publicActivites/from": ["users/isBot"] }
            ]
        }, {
                "publicEvents/validatorsAnswer": [
                    { "publicActivites/from": ["users/isBot"] }
                ]
            }],
        "from": eventId
    }

    let data: any = await axios.post(`${path}/query`, params).catch((err: any) => {
        res.status(400)
        res.send(`Error from DB: ${err.response.statusText}`)
        return
    })

    let event = data.data
    let { parc, val } = await letsFindRealUsers(event, 'public')


    res.status(200)
    res.send({
        finished: !!event[0]['publicEvents/finishTime'],
        status: event[0]['publicEvents/status'],
        parcipiants: parc.length,
        validators: val.length
    })
}

const checkBalance = async (req: any, res: any) => {
    let email = req.body.email
    if (!email) {
        res.status(400)
        res.send('enter correct email')
        return
    }

    let params = {
        "select": ["wallet"],
        "from": ["users/email", email]
    }

    let data: any = await axios.post(`${path}/query`, params).catch((err: any) => {
        if (err) {
            return { status: `Error from DB: ${err.response.statusText}` }
        }
    })

    if (data.status != 200 || !data.data.length) {
        res.status(400)
        res.send('Error from DB: check your email for correctness')
        return
    }

    if (data && data.data.length) {
        let pureData = data.data[0]

        let { bet, bty } = await balanceCheck(pureData.wallet)
        let addData = await getMintBalance(pureData._id, res)

        res.status(200)
        res.send({ _id: pureData._id, bty, bet, addData })
    }
}

const getMintBalance = async (id: string, res: any) => {
    let params = {
        "select": [{ "users/minted": ["*"] }],
        "from": id
    }
    let balance: any = await axios.post(`${path}/query`, params).catch((err: any) => {
        if (res) {
            res.status(400)
            res.send('Error from DB: check your email for correctness')
        }
        return
    })

    if (balance.data[0]["users/minted"] == undefined) {
        return null
    } else {
        return balance.data[0]["users/minted"].map((x: any) => {
            return {
                userId: x['mint/user']["_id"],
                amount: x['mint/amount'],
                purpose: x['mint/purpose'],
                date: new Date(x['mint/date'] * 1000),
                tx: x['mint/tx']
            }
        })
    }


}


export {
    analytics24h,
    analyticsByEventId,
    usersAmount,
    checkBalance,
    getMintBalance
}
