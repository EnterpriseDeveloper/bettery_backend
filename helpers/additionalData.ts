import axios from "axios";
import { path } from "../config/path";

const getAdditionalData = async (events: any, res: any) => {
    for (let i = 0; i < events.length; i++) {
        // get last comment
        let confComment = {
            "select": ["comments/comment", "comments/date"],
            "where": `comments/publicEventsId = ${Number(events[i].id)}`,
            "opts": { "orderBy": ["DESC", "comments/date"] }
        }
        let comments: any = await axios.post(path + "/query", confComment)
            .catch((err) => {
                console.log("DB error: " + err.response)
                res.status(400);
                res.send(err.response);
                return;
            })

        events[i].commentsAmount = comments.data.length
        if (comments.data.length != 0) {
            events[i].lastComment = comments.data[0]['comments/comment'];
        } else {
            events[i].lastComment = "null";
        }
    }

    return events;
}

const getAnswers = (x: any, userId: any) => {
    let findA = findAnswer(x, userId);
    return {
        event_id: x.id,
        answer: findA.answer,
        from: findA.from,
        answered: findA.answer != undefined ? true : false,
        amount: 0, // TODO remove do not using
        betAmount: findA.amount,
        mintedToken: findA.mintedToken,
        payToken: findA.payToken

    };
}

const findAnswer = (data: any, userId: any) => {
    let findParticipiant = data.parcipiantAnswers != undefined ? data.parcipiantAnswers.findIndex((x: any) => { return Number(x.userId) == Number(userId) }) : - 1;
    let findValidators = data.validatorsAnswers != undefined ? data.validatorsAnswers.findIndex((x: any) => { return Number(x.userId) == Number(userId) }) : -1;
    if (findParticipiant === -1 && findValidators != -1) {
        return {
            answer: findValidators != -1 ? data.validatorsAnswers[findValidators].answer : undefined,
            from: 'validator',
            amount: 0,
            mintedToken: data.validatorsAnswers[findValidators].mintedToken == undefined ? 0 : data.validatorsAnswers[findValidators].mintedToken,
            payToken: data.validatorsAnswers[findValidators].payToken == undefined ? 0 : data.validatorsAnswers[findValidators].payToken
        };
    } else if (findParticipiant != -1 && findValidators === -1) {
        return {
            answer: data.parcipiantAnswers[findParticipiant].answer,
            from: 'participant',
            amount: data.parcipiantAnswers[findParticipiant].amount,
            mintedToken: data.parcipiantAnswers[findParticipiant].mintedToken == undefined ? 0 : data.parcipiantAnswers[findParticipiant].mintedToken,
            payToken: data.parcipiantAnswers[findParticipiant].payToken == undefined ? 0 : data.parcipiantAnswers[findParticipiant].payToken
        };
    } else {
        return {
            answer: undefined,
            from: undefined,
            amount: 0,
            mintedToken: 0,
            payToken: 0
        }
    }
}

export {
    getAdditionalData,
    getAnswers
}
