import axios from 'axios';

import { path } from "../../config/path";
import { validateCendToDB } from '../../services/events/publicActivites';
import { MsgCreateValidPubEvents } from "../../contract-services/publicEvents/tx";
import { connectToSign } from "../../helpers/connectToSign";


const validEventBot = async (req: any, res: any) => {
    const eventId = req.body.id;
    const trueAnswerNumber = req.body.answer - 1;

    const eventParams = {
        "select": ['answers', 'endTime', 'status', 'validatorsAmount', { "publicEvents/validatorsAnswer": ["from"] }],
        "from": eventId,
    }
    const botParams = {
        "select": ["_id", "expertReputPoins", "seedPhrase"],
        "where": "users/isBot = true"
    }

    const event = await axios.post(`${path}/query`, eventParams).catch((err) => {
        res.status(400);
        res.send(err.toJSON().message);
        return;
    })
    const bots = await axios.post(`${path}/query`, botParams).catch((err) => {
        res.status(400);
        res.send(err.toJSON().message);
        return;
    })

    if (event && event.data[0] && bots) {
        const eventData = event.data[0]

        if (eventData["publicEvents/validatorsAnswer"] == undefined) {
            eventData["publicEvents/validatorsAnswer"] = []
        }

        if (trueAnswerNumber >= eventData.answers.length || trueAnswerNumber < 0) {
            res.status(400)
            res.send('Answer number is invalid')
            return;
        }

        if (eventData["publicEvents/validatorsAnswer"].length >= eventData.validatorsAmount && eventData.validatorsAmount !== 0) {
            res.status(400)
            res.send('Event is valid')
            return;
        }

        if (eventData.status !== 'deployed') {
            res.status(400)
            res.send('Event status is reverted or finished')
            return;
        }

        const endTimeRes = checkEventTime(eventData.endTime)
        if (endTimeRes && endTimeRes.status === 400) {
            res.status(endTimeRes.status)
            res.send(endTimeRes.response)
            return;
        }

        const choosenBot = chooseBots(bots.data, 1, eventData['publicEvents/validatorsAnswer'], true)
        if (choosenBot && choosenBot[0].status) {
            res.status(choosenBot[0].status)
            res.send(choosenBot[0].response)
            return;
        }

        const firstValidBotRes = await firstValidBot(choosenBot[0], eventData, eventId, trueAnswerNumber)
        if (firstValidBotRes && firstValidBotRes.status) {
            res.status(firstValidBotRes.status)
            res.send(firstValidBotRes.response)
            if (firstValidBotRes.status === 400) {
                return;
            }
        }

        setTimeout(async () => {

            const eventAfterTimeout = await axios.post(`${path}/query`, eventParams).catch((err) => {
                res.status(400);
                res.send(err.toJSON().message);
                return;
            })
            if (eventAfterTimeout && eventAfterTimeout.data[0]) {

                if (eventAfterTimeout.data[0].status !== 'deployed') {
                    res.status(400)
                    res.send('Event status is reverted or finished')
                    return;
                }

                const numberOfValids = eventAfterTimeout.data[0].validatorsAmount - eventAfterTimeout.data[0]["publicEvents/validatorsAnswer"].length
                const trueAnswers = countTrueAnswers(numberOfValids)
                const choosenBots = chooseBots(bots.data, numberOfValids, eventAfterTimeout.data[0]['publicEvents/validatorsAnswer'], false)
                if (choosenBots && choosenBots[0].status) {
                    res.status(choosenBots[0].status)
                    res.send(choosenBots[0].response)
                    return;
                }
                const startValidateRes = await startValidate(choosenBots, trueAnswers, eventData, eventId, trueAnswerNumber)

                if (startValidateRes && startValidateRes.status === 400) {
                    res.status(startValidateRes.status)
                    res.send(startValidateRes.response)
                    return;
                }

            } else {
                res.status(400)
                res.send('Event id is invalid')
                return;
            }

        }, 120000)

    } else {
        res.status(400)
        res.send('Event id is invalid')
        return;
    }
}

const startValidate = async (choosenBots: any, trueAnswers: any, eventData: any, eventId: any, trueAnswerNumber: any) => {
    for (let i = 0; i < choosenBots.length; i++) {

        if (i < trueAnswers) {
            const answerValue = eventData.answers[trueAnswerNumber]
            const getTransect = await setToNetworkValidation(choosenBots[i].expertReputPoins, eventId, answerValue, choosenBots[i].seedPhrase)

            if (getTransect && getTransect.transact) {
                validateCendToDB(eventId, choosenBots[i]._id, choosenBots[i].expertReputPoins, getTransect.transact, trueAnswerNumber)
            } else {
                return {
                    status: getTransect.status,
                    response: getTransect.response
                }
            }

        } else {
            const falseAnswerNumber = generateFalseAnswerNumber(eventData.answers.length)
            const answerValue = eventData.answers[falseAnswerNumber]
            const getTransect = await setToNetworkValidation(choosenBots[i].expertReputPoins, eventId, answerValue, choosenBots[i].seedPhrase)

            if (getTransect && getTransect.transact) {
                validateCendToDB(eventId, choosenBots[i]._id, choosenBots[i].expertReputPoins, getTransect.transact, falseAnswerNumber)
            } else {
                return {
                    status: getTransect.status,
                    response: getTransect.response
                }
            }
        }
    }
}

const firstValidBot = async (choosenBot: any, eventData: any, eventId: any, trueAnswerNumber: any) => {
    const answerValue = eventData.answers[trueAnswerNumber]
    const getTransect = await setToNetworkValidation(choosenBot.expertReputPoins, eventId, answerValue, choosenBot.seedPhrase)

    if (getTransect && getTransect.transact) {
        validateCendToDB(eventId, choosenBot._id, choosenBot.expertReputPoins, getTransect.transact, trueAnswerNumber)
        return {
            status: 200,
            response: 'Validation started'
        }
    } else {
        return {
            status: getTransect.status,
            response: getTransect.response
        }
    }
}

const generateFalseAnswerNumber = (answers: number) => {
    return Math.floor(Math.random() * answers)
}

const shuffle = (array: any[]) => {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array
}

const chooseBots = (botsData: any[], numberOfValids: number, answers: any[], checkEventValid: boolean) => {
    let botsForValidate: any[] = [];


    for (let bot of botsData) {
        if (answers[0]) {
            for (let answer of answers) {
                if (checkEventValid && answer.from._id == bot._id) {
                    return [{
                        status: 400,
                        response: 'Event was validated'
                    }]
                }
                if (answer.from._id !== bot._id) {
                    if (bot.expertReputPoins == undefined) {
                        bot.expertReputPoins = 0
                    }
                    botsForValidate.push(bot)
                }
            }
        } else {
            if (bot.expertReputPoins == undefined) {
                bot.expertReputPoins = 0
            }
            botsForValidate.push(bot)
        }
    }

    botsForValidate = shuffle(botsForValidate)
    botsForValidate = botsForValidate.slice(0, numberOfValids)

    return botsForValidate;
}


const checkEventTime = (endTime: number) => {
    const nowTime = Math.floor(Date.now() / 1000);
    if (endTime > nowTime) {
        return {
            status: 400,
            response: { status: 'Event time is not over' }
        }
    }
    return;
}

const countTrueAnswers = (numberOfValids: number) => {
    if (numberOfValids == 1) {
        return 1
    }
    if (numberOfValids <= 0) {
        return {
            status: 400,
            response: { status: 'Number of valids < 1' }
        }
    }
    const trueAnswers = Math.floor((numberOfValids / 10) * 6);

    return trueAnswers
}

const setToNetworkValidation = async (reput: any, eventId: number, answerValue: any, mnemonic: string) => {
    const types = [
        ["/VoroshilovMax.bettery.publicevents.MsgCreateValidPubEvents", MsgCreateValidPubEvents],
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
        typeUrl: "/VoroshilovMax.bettery.publicevents.MsgCreateValidPubEvents",
        value: {
            creator: address,
            pubId: eventId,
            answers: answerValue,
            reput
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
            response: { status: String(err.error) }
        }
    }
}

export {
    validEventBot,
    chooseBots,
    checkEventTime,
    countTrueAnswers,
    generateFalseAnswerNumber,
    shuffle
}

