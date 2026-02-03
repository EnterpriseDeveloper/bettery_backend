import axios from "axios";
import { path } from "../../config/path";
import Web3 from "web3";
import { connectToSign } from '../connectToChain'

const payToRefferers = async (id: any) => {
    console.log("from payToRefferers")
    console.log(id);

    let getPlayers: any = await fetchDataFromDb(id);

    let mintedTokens = Number(getPlayers.data[0]["mintedTokens"]);
    let finalAnswerNumber = Number(getPlayers.data[0]["finalAnswerNumber"]);
    let players = getPlayers.data[0]["publicEvents/parcipiantsAnswer"];
    const ref = letFindAllRef(players);
    let refAmount = getRefAmount(ref);
    let contrPercet = await getPercentFromContract()
    let allData = calcTokens(ref, refAmount, mintedTokens, contrPercet);
    let { payRefAddr, payRefAmount, payComp } = getRefStruct(allData, "none", refAmount, mintedTokens, contrPercet);

    let { memonic, address, client } = await connectToSign()

    const msg = {
        typeUrl: "/VoroshilovMax.bettery.funds.MsgCreateMintBet",
        value: {
            creator: address,
            pubId: id,
            refOneAddr: payRefAddr[0],
            refOneAmount: payRefAmount[0],
            refTwoAddr: payRefAddr[1],
            refTwoAmount: payRefAmount[1],
            refThreeAddr: payRefAddr[2],
            refThreeAmount: payRefAmount[2],
            payToComp: payComp
        }
    };
    const fee = {
        amount: [],
        gas: "10000000000000",
    };
    try {
        // TODO test
        let tx = await client.signAndBroadcast(address, [msg], fee, memonic);
        console.log("FROM PAY TO REF")
        console.log(tx);
        
        let allWinners = await getDataUser(Number(id), Number(finalAnswerNumber))
        sendToDbPayRef(allWinners, payRefAddr[0], payRefAmount[0], payRefAmount[1], payRefAmount[2])
    } catch (err) {
        console.log(err)
    }
}

const fetchDataFromDb = async (id: any) => {
    let fetchData = {
        "select": [
            "mintedTokens",
            "finalAnswerNumber",
            {
                "publicEvents/parcipiantsAnswer": [
                    {
                        "publicActivites/from": [
                            {
                                "users/invitedBy": [
                                    "users/wallet",
                                    {
                                        "users/invitedBy": [
                                            "users/wallet",
                                            { "users/invitedBy": ["_id", "users/wallet"] }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ],
        "from": Number(id)
    }

    return await axios.post(`${path}/query`, fetchData).catch((err) => {
        console.log("DB error from query payToRefferers: " + err.response.data.message)
        return;
    })
}

const letFindAllRef = (players: any) => {
    let allData = [];
    for (let i = 0; i < players.length; i++) {
        // find L1
        if (players[i]['publicActivites/from']['users/invitedBy']) {
            let walletRef = players[i]['publicActivites/from']['users/invitedBy']['users/wallet']
            let findRef = allData.findIndex((x) => { return x.wallet == walletRef && x.level == 0 })
            if (findRef == -1) {
                allData.push({
                    wallet: walletRef,
                    amount: 1,
                    level: 0
                })
            } else {
                allData[findRef].amount++;
            }
            //  find L2
            if (players[i]['publicActivites/from']['users/invitedBy']['users/invitedBy']) {
                let walletRef = players[i]['publicActivites/from']['users/invitedBy']['users/invitedBy']['users/wallet']
                let findRef = allData.findIndex((x) => { return x.wallet == walletRef && x.level == 1 })
                if (findRef == -1) {
                    allData.push({
                        wallet: walletRef,
                        amount: 1,
                        level: 1
                    })
                } else {
                    allData[findRef].amount++;
                }

                // find L3
                if (players[i]['publicActivites/from']['users/invitedBy']['users/invitedBy']['users/invitedBy']) {
                    let walletRef = players[i]['publicActivites/from']['users/invitedBy']['users/invitedBy']['users/invitedBy']['users/wallet']
                    let findRef = allData.findIndex((x) => { return x.wallet == walletRef && x.level == 2 })
                    if (findRef == -1) {
                        allData.push({
                            wallet: walletRef,
                            amount: 1,
                            level: 2
                        })
                    } else {
                        allData[findRef].amount++;
                    }
                }
            }
        }
    }
    return allData;
}

const getRefAmount = (allData: any) => {
    let ref1 = 0, ref2 = 0, ref3 = 0, refAmount = [];
    for (let i = 0; i < allData.length; i++) {
        if (allData[i].level == 0) {
            ref1 = ref1 + allData[i].amount;
        }
        if (allData[i].level == 1) {
            ref2 = ref2 + allData[i].amount;
        }
        if (allData[i].level == 2) {
            ref3 = ref3 + allData[i].amount;
        }
    }
    refAmount[0] = ref1;
    refAmount[1] = ref2;
    refAmount[2] = ref3;
    return refAmount;
}

const calcTokens = (allData: any, refAmount: any, mintedTokens: any, percent: any) => {
    return allData.map((x: any) => {
        return {
            ...x,
            tokens: (percent[x.level] * mintedTokens / 100) * x.amount / refAmount[x.level]
        }
    })
}

const getPercentFromContract = async () => {
    // TODO get percent from blockchain
    let percent = [];
    percent[0] = Number(4);
    percent[1] = Number(4);
    percent[2] = Number(2);
    return percent;
}

const getRefStruct = (allData: any, fakeAddr: any, refAmount: any, mintedTokens: any, contrPercet: any) => {
    let web3 = new Web3();
    let payRefAddr: any[] = [[], [], []];
    let payRefAmount: any[] = [[], [], []];
    let payComp: any = 0;
    if (refAmount[0] > 0) {
        for (let i = 0; i < allData.length; i++) {
            if (allData[i].level == 0) {
                payRefAddr[0].push(allData[i].wallet);
                payRefAmount[0].push(web3.utils.toWei(String(allData[i].tokens), "ether"))
            }
        }
        if (refAmount[1] > 0) {
            for (let i = 0; i < allData.length; i++) {
                if (allData[i].level == 1) {
                    payRefAddr[1].push(allData[i].wallet);
                    payRefAmount[1].push(web3.utils.toWei(String(allData[i].tokens), "ether"))
                }
            }
            if (refAmount[2] > 100) {
                for (let i = 0; i < allData.length; i++) {
                    if (allData[i].level == 2) {
                        payRefAddr[2].push(allData[i].wallet);
                        payRefAmount[2].push(web3.utils.toWei(String(allData[i].tokens), "ether"))
                    }
                }
            } else {
                payRefAddr[2][0] = fakeAddr;
                payRefAmount[2][0] = '0';
                payComp = web3.utils.toWei(String((contrPercet[2]) * mintedTokens / 100), "ether");
            }
        } else {
            payRefAddr[1][0] = fakeAddr;
            payRefAddr[2][0] = fakeAddr;
            payRefAmount[1][0] = '0';
            payRefAmount[2][0] = '0';
            payComp = web3.utils.toWei(String((contrPercet[1] + contrPercet[2]) * mintedTokens / 100), "ether");
        }

    } else {
        payRefAddr[0][0] = fakeAddr;
        payRefAddr[1][0] = fakeAddr;
        payRefAddr[2][0] = fakeAddr;
        payRefAmount[0][0] = '0';
        payRefAmount[1][0] = '0';
        payRefAmount[2][0] = '0';
        payComp = web3.utils.toWei(String((contrPercet[0] + contrPercet[1] + contrPercet[2]) * mintedTokens / 100), "ether");
    }

    return { payRefAddr, payRefAmount, payComp }
}

let getDataUser = async (id: number, finalAnswerNumber: number) => {
    let data = {
        "select": [
            "publicEvents/parcipiantsAnswer", {
                "publicEvents/parcipiantsAnswer": ["publicActivites/answer", "publicActivites/from", {
                    "publicActivites/from": ["invitedBy", { "invitedBy": ["users/wallet"] }]
                }]
            }
        ],
        "from": id
    }

    let dataFromDB: any = await axios.post(`${path}/query`, data).catch((err) => {
        console.log("DB error getDataUser from  payToRefferers: " + err.response.data.message)
        return;
    })

    return dataFromDB.data[0]['publicEvents/parcipiantsAnswer'].filter((el: any) => {
        return el['publicActivites/answer'] === finalAnswerNumber
    })

}

// TODO ask about ref ANDREY Sohrin
let sendToDbPayRef = (allWinners: any, payRefAddr: any, payRefAmount0: any, payRefAmount1: any, payRefAmount2: any) => {
    let data = allWinners.map((el: any) => {
        let pubActivitesId = el._id;
        let index = -1;
        let num1;
        let num2;
        let num3;
        if (el['publicActivites/from'].invitedBy) {
            index = payRefAddr.indexOf(el['publicActivites/from'].invitedBy['users/wallet'])
            num1 = payRefAmount0[index] == undefined ? '0' : payRefAmount0[index]
            num2 = payRefAmount1[index] == undefined ? '0' : payRefAmount1[index]
            num3 = payRefAmount2[index] == undefined ? '0' : payRefAmount2[index]
        } else {
            return []
        }

        let web3 = new Web3();
        let amount1 = web3.utils.fromWei(String(num1), "ether");
        let amount2 = web3.utils.fromWei(String(num2), "ether");
        let amount3 = web3.utils.fromWei(String(num3), "ether");

        return {
            _id: pubActivitesId,
            refAmount1: String(amount1),
            refAmount2: String(amount2),
            refAmount3: String(amount3)
        }

    }).flat()

    if (data.length) {
        axios.post(`${path}/transact`, data).catch((err) => {
            console.log("DB error from send to DB refIndo: " + err.response.data.message)
            return;
        })
    }
}

export {
    payToRefferers
}
