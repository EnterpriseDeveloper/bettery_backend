import axios from 'axios';
import { getMintBalance } from '../../analytics/analitics';
import { path } from '../../config/path';
import { mintTokens } from '../../services/funds/betteryToken'

const mintTokenOnCrowdedEvent = async (id: number) => {
    let findActivites = {
        "select": [
            { "host": ["wallet"] },
            { "parcipiantsAnswer": ["_id"] }
        ],
        "from": id
    }

    let data: any = await axios.post(`${path}/query`, findActivites).catch(err => {
        console.log(err)
    })
    if (data.data.length) {
        let part = data.data[0].parcipiantsAnswer.length
        if (part >= 10) {
            let userId = data.data[0].host._id
            let balance = await getMintBalance(userId, undefined)
            if (balance) {
                let index = balance.findIndex((x: any) => { return x.purpose == "events with 10 users is reached" })
                if (index == -1) {
                    let userWallet = data.data[0].host.wallet
                    await mintTokens(userWallet, 77, userId, "events with 10 users is reached");
                }
            } else {
                let userWallet = data.data[0].host.wallet
                await mintTokens(userWallet, 77, userId, "events with 10 users is reached");
            }
        }
    }
}

export {
    mintTokenOnCrowdedEvent
}