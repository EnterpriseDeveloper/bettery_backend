const publicEventStructure = (data: any) => {
    return data.filter((x: any) => {
        if (x['publicEvents/status'] == "id created") {
            return false;
        }
        return true;
    }).map((z: any) => {
        return {
            answerAmount: z["publicEvents/parcipiantsAnswer"] === undefined ? 0 : z["publicEvents/parcipiantsAnswer"].length,
            startTime: z['publicEvents/startTime'],
            id: z._id,
            hashtags: z['publicEvents/hashtags'],
            resolutionDetalis: z["publicEvents/resolutionDetalis"] === undefined ? "undefined" : z["publicEvents/resolutionDetalis"],
            host: {
                id: z['publicEvents/host']["_id"],
                nickName: z['publicEvents/host']['users/nickName'],
                avatat: z['publicEvents/host']['users/avatar'],
                wallet: z['publicEvents/host']['users/wallet'],
                mintedHostAmount: z['publicEvents/mintedHostAmount'] === undefined ? 0 : z['publicEvents/mintedHostAmount'],
                payHostAmount: z['publicEvents/payHostAmount'] === undefined ? 0 : z['publicEvents/payHostAmount'],
                mintedAdvisorAmount: z['publicEvents/mintedAdvisorAmount'] === undefined ? 0 : z['publicEvents/mintedAdvisorAmount'],
                payAdvisorAmount: z['publicEvents/payAdvisorAmount'] === undefined ? 0 : z['publicEvents/payAdvisorAmount']
            },
            thumImage: z['publicEvents/thumImage'] === undefined ? "undefined" : z['publicEvents/thumImage'],
            thumColor: getPublicColor(z),
            thumFinish: getFinishImage(z),
            validated: z['publicEvents/validated'],
            status: z['publicEvents/status'],
            answers: z['publicEvents/answers'],
            finalAnswer: z['publicEvents/finalAnswerNumber'] === undefined ? null : z['publicEvents/finalAnswerNumber'],
            validatorsAmount: z["publicEvents/validatorsAmount"],
            endTime: z['publicEvents/endTime'],
            transactionHash: z['publicEvents/transactionHash'],
            question: z['publicEvents/question'],
            eventEnd: z['publicEvents/eventEnd'] === undefined ? 0 : z['publicEvents/eventEnd'],
            currencyType: z['publicEvents/currencyType'] === undefined ? false : z['publicEvents/currencyType'],
            parcipiantAnswers: z["publicEvents/parcipiantsAnswer"] === undefined ? undefined : z["publicEvents/parcipiantsAnswer"].map((par: any) => {
                return {
                    transactionHash: par['publicActivites/transactionHash'],
                    date: par['publicActivites/date'],
                    answer: par['publicActivites/answer'],
                    userId: par['publicActivites/from']['_id'],
                    amount: par['publicActivites/amount'],
                    avatar: par['publicActivites/from']['users/avatar'],
                    premiumToken: par["publicActivites/premiumToken"] == undefined ? 0 : par["publicActivites/premiumToken"],
                    mintedToken: par["publicActivites/mintedToken"] == undefined ? 0 : par["publicActivites/mintedToken"],
                    payToken: par["publicActivites/payToken"] == undefined ? 0 : par["publicActivites/payToken"]
                }
            }),
            validatorsAnswers: z["publicEvents/validatorsAnswer"] === undefined ? undefined : z["publicEvents/validatorsAnswer"].map((val: any) => {
                return {
                    transactionHash: val['publicActivites/transactionHash'],
                    date: val['publicActivites/date'],
                    answer: val['publicActivites/answer'],
                    userId: val['publicActivites/from']['_id'],
                    avatar: val['publicActivites/from']['users/avatar'],
                    premiumToken: val["publicActivites/premiumToken"] == undefined ? 0 : val["publicActivites/premiumToken"],
                    mintedToken: val["publicActivites/mintedToken"] == undefined ? 0 : val["publicActivites/mintedToken"],
                    payToken: val["publicActivites/payToken"] == undefined ? 0 : val["publicActivites/payToken"]
                }
            }),
            room: {
                id: z['publicEvents/room'][0]['_id'],
                name: z['publicEvents/room'][0]['room/name'],
                color: z['publicEvents/room'][0]['room/color'],
                owner: z['publicEvents/room'][0]['room/owner']['_id'],
                eventAmount: z['publicEvents/room'][0]['room/publicEventsId'].length
            },
        }
    })
}

const privateEventStructure = (data: any) => {
    return data.filter((x: any) => {
        if (x['privateEvents/status'] == "id created") {
            return false;
        }
        return true;
    }).map((z: any) => {
        return {
            winner: z['privateEvents/winner'],
            loser: z['privateEvents/loser'],
            startTime: z['privateEvents/startTime'],
            endTime: z['privateEvents/endTime'],
            transactionHash: z['privateEvents/transactionHash'],
            id: z._id,
            status: z['privateEvents/status'],
            question: z['privateEvents/question'],
            answers: z["privateEvents/answers"],
            resolutionDetalis: z["privateEvents/resolutionDetalis"] === undefined ? "undefined" : z["privateEvents/resolutionDetalis"],
            host: {
                id: z['privateEvents/host']["_id"],
                nickName: z['privateEvents/host']['users/nickName'],
                avatat: z['privateEvents/host']['users/avatar'],
                wallet: z['privateEvents/host']['users/wallet']
            },
            thumImage: z['privateEvents/thumImage'] === undefined ? "undefined" : z['privateEvents/thumImage'],
            thumColor: getPrivateColor(z),
            finalAnswer: z["privateEvents/finalAnswer"],
            finalAnswerNumber: z["privateEvents/finalAnswerNumber"],
            parcipiantAnswers: z["privateEvents/parcipiantsAnswer"] === undefined ? undefined : z["privateEvents/parcipiantsAnswer"].map((par: any) => {
                return {
                    transactionHash: par['privateActivites/transactionHash'],
                    date: par['privateActivites/date'],
                    answer: par['privateActivites/answer'],
                    userId: par['privateActivites/from']['_id'],
                    avatar: par['privateActivites/from']['users/avatar'],
                    role: par['privateActivites/role']
                }
            }),
            validatorAnswer: z["privateEvents/validatorAnswer"] === undefined ? undefined : {
                transactionHash: z['privateEvents/validatorAnswer']['privateActivites/transactionHash'],
                date: z['privateEvents/validatorAnswer']['privateActivites/date'],
                answer: z['privateEvents/validatorAnswer']['privateActivites/answer'],
                userId: z['privateEvents/validatorAnswer']['privateActivites/from']['_id'],
                avatar: z['privateEvents/validatorAnswer']['privateActivites/from']['users/avatar'],
                role: z['privateEvents/validatorAnswer']['privateActivites/role'],
                nickName: z['privateEvents/validatorAnswer']['privateActivites/from']['users/nickName'],
            },
            room: {
                name: z['privateEvents/room'][0]['room/name'],
                color: z['privateEvents/room'][0]['room/color'],
                owner: z['privateEvents/room'][0]['room/owner']['_id']
            }
        }
    })
}

const getPublicColor = (z: any) => {
    if (z['publicEvents/thumImage'] === undefined) {
        return z['publicEvents/thumColor'] === undefined ? z['publicEvents/room'][0]['room/color'] : z['publicEvents/thumColor']
    } else {
        return "undefined"
    }
}

const getFinishImage = (z: any) => {
    if (z['publicEvents/thumFinish'] != undefined) {
        const timeNow = Number((Date.now() / 1000).toFixed(0));
        let finishDate = z['publicEvents/endTime'];
        if (timeNow - finishDate > 0) {
            return z['publicEvents/thumFinish']
        } else {
            return "undefined"
        }
    } else {
        return "undefined"
    }
}

const getPrivateColor = (z: any) => {
    if (z['privateEvents/thumImage'] === undefined) {
        return z['privateEvents/thumColor'] === undefined ? z['privateEvents/room'][0]['room/color'] : z['privateEvents/thumColor'];
    } else {
        return "undefined"
    }

}

export {
    publicEventStructure,
    privateEventStructure
}
