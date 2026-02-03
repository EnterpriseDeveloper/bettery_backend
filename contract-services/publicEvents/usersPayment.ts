import axios from "axios";
import { path } from "../../config/path";
import Web3 from "web3";
import { expReputationCalc } from "./expertReputation"
import { payToRefferers } from './payToRefferers';
import { setCorrectAnswer, eventEnd } from '../../services/events/event_is_finish';

let send: number = 0;
const usersPayment = async (data: any) => {
    let { eventId, isMinted, dataForPayments, correctAnswer, mintedTokens } = getNeededData(data)

    if (eventId && send != eventId) {
        send = eventId;
        let params = {
            "select": [
                "publicEvents/host", { "publicEvents/host": ["users/wallet"] },
                "publicEvents/validatorsAnswer",
                {
                    "publicEvents/validatorsAnswer":
                        ["publicActivites/from", { "publicActivites/from": ["users/wallet", "users/expertReputPoins"] }, "publicActivites/answer"]
                },
                "publicEvents/parcipiantsAnswer", { "publicEvents/parcipiantsAnswer": ["publicActivites/amount", "publicActivites/from", { "publicActivites/from": ["users/wallet"] }, "publicActivites/answer"] }

            ],
            "from": Number(eventId)
        }

        let dataFromDb: any = await axios.post(`${path}/query`, params).catch(err => {
            console.error("DB error in 'usersPayment': " + err.response.data.message)
            return
        })

        let participants = dataFromDb.data[0]['publicEvents/parcipiantsAnswer'];
        let validators = dataFromDb.data[0]['publicEvents/validatorsAnswer'];
        let hostWallet = dataFromDb.data[0]['publicEvents/host']['users/wallet']

        dataForPayments = arrayRestructuring(dataForPayments);

        let dataForSend: any;

        const partcPayment = packingForSending(participants, dataForPayments, eventId, hostWallet, isMinted, correctAnswer)
        const validatorsPayment = packingForSending(validators, dataForPayments, eventId, hostWallet, isMinted, correctAnswer)

        dataForSend = partcPayment.concat(validatorsPayment)

        const { isPartc, isValidators } = checkHost(participants, validators, hostWallet)

        if (!isPartc.length && !isValidators.length) {
            let web3 = new Web3();
            let hostData = dataForPayments.filter((o: any) => {
                return o[0].key == 'recipient' && o[0].value == hostWallet
            })

            if (isMinted == 'false') {
                dataForSend.push({
                    '_id': Number(eventId),
                    'payHostAmount': web3.utils.fromWei(String(hostData[0][2].value.replace(/[a-zа-яё]/gi, '')), 'ether'),
                })
            }
            if (isMinted == 'true') {
                dataForSend.push({
                    '_id': Number(eventId),
                    'payHostAmount': web3.utils.fromWei(String(hostData[1][2].value.replace(/[a-zа-яё]/gi, '')), 'ether'),
                    'mintedHostAmount': web3.utils.fromWei(String(hostData[0][2].value.replace(/[a-zа-яё]/gi, '')), 'ether'),
                })
            }
        }

        const expRepSend = expReputationCalc(validators, Number(correctAnswer))
        let web3 = new Web3();
        mintedTokens = web3.utils.fromWei(String(mintedTokens), 'ether');

        let dataForCorrectAnswer = {
            id: eventId,
            correctAnswer: correctAnswer,
            tokens: mintedTokens
        }
        await sendToDB(dataForSend.concat(expRepSend.forSendReputation), eventId, dataForCorrectAnswer, mintedTokens)
    } else {
        console.log("DUBLICATE EVENT", eventId)
    }


}

const packingForSending = (partc: any, data: any, eventId: any, hostWallet: string, isMinted: string, correctAnswer: number) => {
    let web3 = new Web3();
    let arr: any = []
    // todo ? sort only winner
    partc.map((el: any) => {
        let wallet = el['publicActivites/from']['users/wallet']
        let answer = el['publicActivites/answer']

        let sortData = data.filter((o: any) => {
            if (o[0].key == 'recipient' && o[0].value == wallet) {
                return o
            }
        })

        if (wallet == hostWallet) {
            let pay2: any = undefined, pay1: any, pay0: any
            let minted: any = undefined

            if (isMinted == 'true') {
                pay1 = sortData[2] == undefined ? undefined : web3.utils.fromWei(String(sortData[2][2].value.replace(/[a-zа-яё]/gi, '')), 'ether');
                pay0 = sortData[1] == undefined ? undefined : web3.utils.fromWei(String(sortData[1][2].value.replace(/[a-zа-яё]/gi, '')), 'ether');
                minted = sortData[0] == undefined ? undefined : web3.utils.fromWei(String(sortData[0][2].value.replace(/[a-zа-яё]/gi, '')), 'ether');

                if (Number(correctAnswer) === Number(answer)) {
                    pay2 = sortData[3] == undefined ? undefined : web3.utils.fromWei(String(sortData[3][2].value.replace(/[a-zа-яё]/gi, '')), 'ether');
                }

                arr.push({
                    '_id': Number(eventId),
                    'payHostAmount': pay0,
                    'mintedHostAmount': minted
                },
                    {
                        '_id': Number(el._id),
                        "mintedToken": pay1,
                        "payToken": pay2 ? pay2 : 0,
                        "premiumToken": 0 //todo premiumToken
                    }
                )
            }
            if (isMinted == 'false') {
                pay1 = sortData[1] == undefined ? undefined : web3.utils.fromWei(String(sortData[1][2].value.replace(/[a-zа-яё]/gi, '')), 'ether');
                pay0 = sortData[0] == undefined ? undefined : web3.utils.fromWei(String(sortData[0][2].value.replace(/[a-zа-яё]/gi, '')), 'ether');


                if (pay1 == undefined) {
                    arr.push({
                        '_id': Number(eventId),
                        'payHostAmount': pay0
                    })
                }
                if (pay1 !== undefined && pay0 !== undefined) {
                    arr.push({
                        '_id': Number(el._id),
                        "mintedToken": 0,
                        "payToken": pay1,
                        "premiumToken": 0 //todo premiumToken
                    }, {
                        '_id': Number(eventId),
                        'payHostAmount': pay0,
                    })
                }
            }
        }

        if (wallet !== hostWallet) {
            let pay1: any, minted: any
            if (isMinted == 'false') {
                pay1 = sortData[0] == undefined ? 0 : web3.utils.fromWei(String(sortData[0][2].value.replace(/[a-zа-яё]/gi, '')), 'ether');
                minted = false
            }
            if (isMinted == 'true') {
                minted = sortData[0] == undefined ? 0 : web3.utils.fromWei(String(sortData[0][2].value.replace(/[a-zа-яё]/gi, '')), 'ether');
                pay1 = sortData[1] == undefined ? 0 : web3.utils.fromWei(String(sortData[1][2].value.replace(/[a-zа-яё]/gi, '')), 'ether');
            }
            arr.push({
                '_id': Number(el._id),
                "mintedToken": minted ? minted : 0,
                "payToken": pay1,
                "premiumToken": 0 //todo premiumToken
            })
        }
    })
    return arr
}

const getNeededData = (data: any) => {
    let walletList = JSON.parse(data.TxResult.result.log)

    let eventDetails: any = walletList[0].events.find((x: any) => {
        return x['type'] == "pub.event"
    });
    const eventId = eventDetails["attributes"].find((y: any) => {
        return y['key'] == 'id'
    })['value']
    const isMinted = eventDetails["attributes"].find((x: any) => {
        return x['key'] == 'minted'
    })['value']

    let dataForPayments = walletList[0].events.find((x: any) => {
        return x.type == "transfer"
    })["attributes"]

    let correctAnswer = eventDetails["attributes"].find((x: any) => {
        return x['key'] == 'answerIndex'
    })['value']


    let letFindMint = () => {
        const token = eventDetails["attributes"].find((x: any) => {
            return x['key'] == 'mintedTokens'
        })
        return !token ? 0 : token['value']
    }
    const mintedTokens = letFindMint()

    return {
        eventId,
        isMinted,
        dataForPayments,
        correctAnswer,
        mintedTokens
    }
}

const sendToDB = async (params: any, eventId: any, dataForCorrectAnswer: any, mintedTokens: any) => {
    axios.post(path + '/transact', params).catch(err => {
        console.log('error in usersPayment: ' + err.response.statusText)
    })
    await setCorrectAnswer(dataForCorrectAnswer)
    await eventEnd({ id: dataForCorrectAnswer.id })
    // lets pay to refferalls
    if (Number(mintedTokens) > 0) {
        await payToRefferers(eventId)
    }
}

const arrayRestructuring = (arr: Array<any>) => {
    let size = 3;
    let subarray = [];

    for (let i = 0; i < Math.ceil(arr.length / size); i++) {
        subarray[i] = arr.slice((i * size), (i * size) + size);
    }

    return subarray;
}


const checkHost = (partc: any, validators: any, hostWallet: any) => {
    let isPartc = partc.filter((el: any) => {
        return el["publicActivites/from"]["users/wallet"] == hostWallet
    })
    let isValidators = validators.filter((el: any) => {
        return el["publicActivites/from"]["users/wallet"] == hostWallet
    })

    return { isPartc, isValidators }
}

export {
    usersPayment
}
