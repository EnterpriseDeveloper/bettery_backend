import axios from "axios";
import Web3 from "web3";
import { path } from "../../config/path";
import { MsgCreatePartPubEvents } from "../../contract-services/publicEvents/tx";

import { mintTokens } from "../../services/funds/betteryToken";
import { balanceCheck } from "../../services/funds/userTokens";
import { participateSendToDB } from "../../services/events/publicActivites";
import { connectToSign } from "../../helpers/connectToSign";

let part_bot = async (req: any, res: any) => {
    const eventId = req.body.id
    const botAmount = req.body.botAmount

    if (!botAmount || botAmount <= 0 || botAmount > 150 || typeof botAmount != "number") {
        res.status(400)
        res.send({ message: "enter the correct number of bots ( bots > 0 && bots <= 150)" })
    } else {
        const eventParams = {
            "select": ["publicEvents/answers", "publicEvents/endTime", {
                "publicEvents/parcipiantsAnswer": [
                    { "publicActivites/from": ["users/isBot"] }
                ]
            }],
            "from": Number(eventId)
        }
        const botParams = {
            "select": ["users/wallet", "users/seedPhrase"],
            "where": "users/isBot = true"
        }

        let event: any = await axios.post(`${path}/query`, eventParams).catch((err) => {
            res.status(400);
            res.send(`Error from DB:  ${err.response.statusText}`);
            return;
        })

        let bots: any = await axios.post(`${path}/query`, botParams).catch((err) => {
            res.status(400);
            res.send(`Error from DB:  ${err.response.statusText}`);
            return;
        })
        if (bots && bots.data.length && event && event.data.length) {
            let endTime = event.data[0]["publicEvents/endTime"]
            let parc = event.data[0]["publicEvents/parcipiantsAnswer"]

            let index: any
            if (parc) {
                index = parc.findIndex((el: any) => {
                    return el["publicActivites/from"]["users/isBot"]
                })
            }
            if (!checkEndTime(endTime)) {
                res.status(400)
                res.send({ message: 'the time for participation in the event has expired, or there is less than 30 minutes left' })
                return
            }

            if (index >= 0) {
                res.status(400)
                res.send({ message: 'bots have already been applied for this event' })
                return
            }

            let botsPartic = letsChooseRandomBots(botAmount, bots.data)
            if (!botsPartic || !botsPartic.length) {
                res.status(400)
                res.send({ status: 'no bots in the database' })
                return
            } else {
                res.status(200)
                res.send({ status: 'OK' })
            }

            for (let i = 0; i < botsPartic.length; i++) {
                let botId = botsPartic[i]._id
                let mnemonic = botsPartic[i]["users/seedPhrase"]
                let wallet = botsPartic[i]["users/wallet"]
                let indexAnswerRandom = Math.floor(Math.random() * (event.data[0]["publicEvents/answers"].length))
                let answerValue = event.data[0]["publicEvents/answers"][indexAnswerRandom]
                let randomBet = letsChooseRandomBet(0.1, 1)
                let { bet } = await balanceCheck(wallet)

                if (bet && bet > randomBet) {
                    let result = await callSendToDemon(randomBet, eventId, answerValue, indexAnswerRandom, botId, mnemonic)
                    if (result) {
                        console.log(`From part_bot: ${result}`)
                        return
                    }
                }
                if (!bet) {
                    let mintResult = await mintTokens(wallet, 100, botId, "bot part additional tokens")
                    if (mintResult) {
                        let result = await callSendToDemon(randomBet, eventId, answerValue, indexAnswerRandom, botId, mnemonic)
                        if (result) {
                            console.log(`From part_bot: ${result}`)
                            return
                        }
                    }
                }
            }
        } else {
            res.status(400)
            res.send({ message: "id not correct " })
        }
    }
}

const letsChooseRandomBots = (amount: number, arr: any) => {
    const shuffled = arr.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, amount);
}

const letsChooseRandomBet = (min: number, max: number) => {
    return Number((Math.random() * (max - min) + min).toFixed(1))
}

const checkEndTime = (time: number) => {
    let endTime: any = (time * 1000).toFixed(0)
    return (endTime - 1800000) > Date.now()
}

const callSendToDemon = async (randomBet: number, eventId: number, answerValue: any, indexAnswerRandom: number, botId: number, mnemonic: string) => {
    let getTransect = await sendToDemonParticipate(randomBet, eventId, answerValue, mnemonic)
    if (getTransect && getTransect.transact) {
        let result = await participateSendToDB(indexAnswerRandom, botId, getTransect.transact, eventId, randomBet)
        if (result.status == 400) {
            return {
                status: 400,
                response: { status: result.response }
            }
        }
    }

    if (getTransect.status == 400) {
        return {
            status: getTransect.status,
            response: { status: getTransect.response }
        }
    }
}

const sendToDemonParticipate = async (randomBet: any, eventId: number, answerValue: any, mnemonic: string) => {
    let web3 = new Web3();
    var _money = web3.utils.toWei(String(randomBet), 'ether')
    const types = [
        ["/VoroshilovMax.bettery.publicevents.MsgCreatePartPubEvents", MsgCreatePartPubEvents],
    ];

    const data: any = await connectToSign(mnemonic, types)
    if (!data.memonic || !data.address || !data.client) {
        return {
            status: 400,
            response: 'Connect to sign error'
        }
    }
    const memonic = data.memonic
    const address = data.address
    const client = data.client

    const msg = {
        typeUrl: "/VoroshilovMax.bettery.publicevents.MsgCreatePartPubEvents",
        value: {
            creator: address,
            pubId: eventId,
            answers: answerValue,
            amount: _money
        }
    };
    const fee = {
        amount: [],
        gas: "10000000000000",
    };
    try {
        let transact: any = await client.signAndBroadcast(address, [msg], fee, memonic);
        if (transact.transactionHash && transact.code == 0) {
            return {
                transact: transact.transactionHash
            }
        } else {
            console.log(`Error sendToDemonPart 1 ${String(transact)}`)
            return {
                status: 400,
                response: { status: String(transact) }
            }
        }
    } catch (err: any) {
        console.log(`Error sendToDemonPart 2 ${String(err.error)}`)
        return {
            status: 400,
            response: { status: String(err.message) }
        }
    }
}

export {
    part_bot,
    checkEndTime,
    letsChooseRandomBots,
    letsChooseRandomBet
}
