import axios from 'axios';
import { path } from "../../config/path"
import Web3 from "web3";
import { connectToSign } from '../../contract-services/connectToChain'

const mintTokens = async (resiever: string, amount: number, userId: number, purpose: string) => {
    let web3 = new Web3();
    let token = web3.utils.toWei(String(amount), "ether");
    let { memonic, address, client } = await connectToSign()

    const msg = {
        typeUrl: "/VoroshilovMax.bettery.funds.MsgCreateMintBet",
        value: {
            creator: address,
            reciever: resiever,
            amount: token,
            userId: userId,
        }
    };
    const fee = {
        amount: [],
        gas: "10000000000000",
    };
    try {
        let tx = await client.signAndBroadcast(address, [msg], fee, memonic);

        let data = [{
            _id: "mint$newMint",
            tx: "0x" + tx.transactionHash,
            amount: amount,
            date: Math.floor(Date.now() / 1000),
            purpose: purpose,
            user: userId
        },
        {
            _id: userId,
            minted: ["mint$newMint"]
        }]

        await axios.post(`${path}/transact`, data).catch(err => {
            console.log("from mint DB", err)
            return err
        })
        return tx;
    } catch (err) {
        console.log("from mint", err)
        return err
    }
}

const getBTYToken = async (req: any, res: any) => {
    let email = req.body.email;
    if (email) {
        let findWallet = {
            "select": ["wallet"],
            "from": ["users/email", email]
        }
        let getWallet = await axios.post(`${path}/query`, findWallet).catch((err) => {
            res.status(400);
            res.send(err.response.data.message);
        })
        if (getWallet) {
            if (getWallet.data.length != 0) {
                let wallet = getWallet.data[0].wallet;
                let id = getWallet.data[0]["_id"]
                let data = await mintTokens(wallet, 10, id, "API call")
                res.status(200);
                res.send(data);
            } else {
                res.status(400);
                res.send({ "message": "user not exist" });
            }
        }
    } else {
        res.status(400);
        res.send({ "message": "email is missed" });
    }
}

export {
    mintTokens,
    getBTYToken
}
