import axios from "axios";
import { path, demonAPI } from "../../config/path";
import Web3 from "web3";

const getTokens = async (req: any, res: any) => {
    let wallet =  req.body.dataFromRedis.wallet
    
    if (req.body.dataFromRedis.id && wallet) {
        let balance = await balanceCheck(wallet)

        if(balance.status == 400){
            res.status(balance.status)
            res.send(balance.response)
        } else {
            let { bet, bty } = balance

            let data = [{
                "_id": Number(req.body.dataFromRedis.id),
                "bet": bet,
                "bty": bty,
                "lastUpdate": Math.floor(Date.now() / 1000)
            }]
            axios.post(path + "/transact", data).then(() => {
                res.status(200);
                res.send({
                    "bet": bet,
                    "bty": bty
                })
            }).catch((err: any) => {
                res.status(400);
                res.send(err.response.data.message);
            })
        }

    }else{
        res.status(400)
        res.send({ status: "Bad request 400" })
    }

}

const balanceCheck = async (wallet: string) => {
    let balance: any = await axios.get(`${demonAPI}:1317/cosmos/bank/v1beta1/balances/${wallet}`).catch((err)=>{
           return {
               status: 400,
               response: err.response,
           }
    })
    if(balance.status == 400){
        return {
            status: 400,
            response: balance.response
        }
    } else {
        let web3 = new Web3();
        let bet = undefined;
        let bty = undefined;

        let balances = balance.data.balances
        bet = balances.find((x: any)=>{return x.denom == "bet"})
        if (bet){
            bet = bet.amount
        }
        bty = balances.find((x: any)=>{return x.denom == "bty"})
        if (bty){
            bty = bty.amount
        }

        let betToken = bet ? Number(Number(web3.utils.fromWei(bet, "ether")).toFixed(2)) : 0
        let btyToken = bty ? Number(Number(web3.utils.fromWei(bty, "ether")).toFixed(2)) : 0

        return {
            bet: betToken,
            bty: btyToken
        }
    }

}


export {
    getTokens,
    balanceCheck
}
