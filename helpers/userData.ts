import { path } from "../config/path";
import axios from "axios";
import reputationConvert from "../helpers/reputationConvert"

const getUserReput = async (id: any, res: any) => {
    let userConfig = {
        "select": ["users/expertReputPoins"],
        "from": Number(id)
    }
    let hostDataWallet: any = await axios.post(`${path}/query`, userConfig).catch((err) => {
        console.log("DB error: " + err.response.data.message)
        res.status(400);
        res.send(err.response.data.message);
        return;
    })

    return reputationConvert(hostDataWallet.data[0]['users/expertReputPoins']);
}

export {
    getUserReput
}
