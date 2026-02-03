import axios from "axios";
import { path } from "../../config/path";

const setInitWithd = (req: any, res: any) => {
    let data = [{
        "_id": "withdrawal$newWithdrawal",
        "userId": req.body.dataFromRedis.id,
        "date": Math.floor(Date.now() / 1000),
        "transactionHash": req.body.transactionHash,
        "status": "pending",
        "amount": req.body.amount
    }]
    axios.post(path + "/transact", data).then(() => {
        res.status(200);
        res.send({ "status": "done" })
    }).catch((err: any) => {
        res.status(400);
        res.send(err.response.data.message);
    })
}

const getWithdInfo = (req: any, res: any) => {
    // TODO
}

export {
    setInitWithd,
    getWithdInfo
}
