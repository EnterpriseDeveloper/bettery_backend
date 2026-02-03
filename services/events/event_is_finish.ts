import axios from "axios";
import { path } from "../../config/path";


const setCorrectAnswer = async (data: any) => {
    let finalAnswer = [{
        "_id": Number(data.id),
        "finalAnswerNumber": Number(data.correctAnswer),
        "finishTime": Math.floor(new Date().getTime() / 1000),
        "mintedTokens": Number(data.tokens)
    }]

    return await axios.post(path + "/transact", finalAnswer)
        .catch((err: any) => {
            console.log("DB error: " + err.response.data.message)
        })
}

const eventEnd = async (data: any) => {
    let finalAnswer = [{
        "_id": Number(data.id),
        "status": "finished",
        "eventEnd": Math.floor(new Date().getTime() / 1000.0)
    }]

    return await axios.post(path + "/transact", finalAnswer)
        .catch((err: any) => {
            console.log("DB error: " + err.response.data.message)
        })
}


export {
    setCorrectAnswer,
    eventEnd
}
