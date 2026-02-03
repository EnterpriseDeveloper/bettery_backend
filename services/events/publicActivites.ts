import axios from "axios";
import { path } from "../../config/path";
import { minBetAmount } from "../../config/limits";

const participate = async (req: any, res: any) => {
    let eventId = req.body.event_id;
    let userId = Number(req.body.dataFromRedis.id)
    let amount = req.body.amount;
    let answerIndex = req.body.answerIndex;
    let transactionHash = req.body.transactionHash

    if (eventId == undefined ||
        userId == undefined ||
        answerIndex == undefined ||
        amount == undefined) {
        res.status(400);
        res.send("Structure is incorrect");
        return;
    }
    let { status, response }  = await participateSendToDB(answerIndex, userId, transactionHash, eventId, amount)

    if(response){
        res.status(status)
        res.send(response)
    }
}

const participateSendToDB = async (answerIndex: any, userId: any, transactionHash: any, eventId: any, amount: any) => {
    let setAnswer: any = []
    if (Number(amount) < minBetAmount) {
        return {
            status: 400,
            response: "The minimum amount for betting is 0.01 BET"
        }
    }
    // TODO add to the history of money transaction
    let publicActivites = {
        _id: "publicActivites$act",
        from: userId,
        answer: answerIndex,
        role: "participant",
        date: Math.floor(Date.now() / 1000),
        transactionHash: transactionHash,
        //    currencyType: currencyType,  TODO remove from DB Shema
        eventId: eventId,
        amount: Number(amount)
    }
    setAnswer.push(publicActivites);

    // increace quntity of publicActivites in event table
    let event = {
        _id: eventId,
        "parcipiantsAnswer": ["publicActivites$act"],
    }
    setAnswer.push(event)

    // add to users table
    let user = {
        _id: userId,
        publicActivites: ["publicActivites$act"],
    }
    setAnswer.push(user)

    await axios.post(`${path}/transact`, setAnswer).catch((err) => {
        console.log("DB error: " + err.response.data.message)
        return {
            status: 400,
            response: err.response.data.message
        }
    })

    return {
        status: 200,
        response: {done: "ok"}
    }
}

const validate = async (req: any, res: any) => {
    let eventId = Number(req.body.event_id);
    let from = Number(req.body.dataFromRedis.id)
    let reputation = req.body.reputation
    let transactionHash = req.body.transactionHash
    let answer = Number(req.body.answer);
    
    if (eventId == undefined ||
        answer == undefined ||
        from == undefined) {
        res.status(400);
        res.send("Structure is incorrect");
        return;
    }

    let { status, response } = await validateCendToDB(eventId, from, reputation, transactionHash, answer)

    if (response) {
        res.status(status)
        res.send(response)
    }
}

const validateCendToDB = async (eventId: any, from: any, reputation: any, transactionHash: any, answer: any) => {
    let setAnswer = []

    // add to the publicActivites table
    let publicActivites = {
        _id: "publicActivites$act1",
        from: from,
        answer: answer,
        role: "validator",
        date: Math.floor(Date.now() / 1000),
        transactionHash: transactionHash,
        // currencyType: currencyType, TODO remove from DB Shema
        eventId: eventId,
        amount: 0,
        expertReput: reputation
    }
    setAnswer.push(publicActivites);

    // increace quntity of publicActivites in event table
    let event = {
        _id: eventId,
        "validatorsAnswer": ["publicActivites$act1"],
    }
    setAnswer.push(event)

    let user = {
        _id: from,
        publicActivites: ["publicActivites$act1"],
    }
    setAnswer.push(user)

    await axios.post(`${path}/transact`, setAnswer).catch((err) => {
        console.log("DB error: " + err.response.data.message)
        return {
            status: 400,
            response: err.response.data.message
        }
    })

    return {
        status: 200,
        response: { done: "ok" }
    }
}


export {
    participate,
    validate,
    participateSendToDB,
    validateCendToDB
}
