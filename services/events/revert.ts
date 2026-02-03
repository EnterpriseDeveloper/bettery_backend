import axios from "axios";
import { path } from "../../config/path";
import { connectToSign } from '../../contract-services/connectToChain'

const setRevertEvent = async (req: any, res: any) => {
    let id = Number(req.body.id);
    let purpose = req.body.purpose;

    let config = {
        "select": ["*",
            { 'publicEvents/parcipiantsAnswer': ["*"] }
        ],
        "from": id
    }

    let data: any = await axios.post(`${path}/query`, config).catch((err: any) => {
        console.log(err);
        return;
    })

    if (data.data.length != 0) {
        if (data.data[0]['publicEvents/status'].search('finished') != -1) {
            res.status(400);
            res.send({ "status": "already finished" });
        } else if (data.data[0]['publicEvents/status'].search("reverted") != -1) {
            res.status(400);
            res.send({ "status": "already reverted" });
        } else {
            let partic = data.data[0]['publicEvents/parcipiantsAnswer']
            await revertEvent(id, partic, purpose, res);
        }
    } else {
        res.status(400);
        res.send({ "status": "event not found" });
    }
}

const revertEvent = async (eventId: any, participant: any, purpose: any, res: any) => {
    let revert = [{
        "_id": eventId,
        "status": `reverted: ${purpose}`,
        "eventEnd": Math.floor(new Date().getTime() / 1000.0)
    }]

    await axios.post(`${path}/transact`, revert).catch((err: any) => {
        console.log(err);
        return;
    })

    if (participant !== undefined) {
        let { memonic, address, client } = await connectToSign()

        const msg = {
            typeUrl: "/VoroshilovMax.bettery.publicevents.MsgCreateRefundPubEvents",
            value: {
                creator: address,
                pubId: eventId,
                purpose: purpose
            }
        };
        const fee = {
            amount: [],
            gas: "10000000000000",
        };
        try {
            await client.signAndBroadcast(address, [msg], fee, memonic);
            if (res) {
                res.status(200);
                res.send({ "status": "done" });
            }
        } catch (err) {
            console.log("from revertEvent", err)
            if (res) {
                res.status(400);
                res.send(err);
            }
        }
    } else {
        if (res) {
            res.status(200);
            res.send({ "status": "done" });
        }
    }
}

export {
    setRevertEvent,
    revertEvent
}