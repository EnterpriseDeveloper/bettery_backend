import axios from "axios";
import { path } from "../../config/path";

const emailSub = async (req: any, res: any) => {
    const create = [{
        "_id": "emailSubscribe$newSub",
        "email": req.body.email,
        "from": req.body.from
    }]

    await axios.post(`${path}/transact`, create).catch((err) => {
        res.status(400);
        res.send(err.response.data.message);
        return;
    })

    res.status(200);
    res.send({ "status": "ok" });
}

export {
    emailSub
}