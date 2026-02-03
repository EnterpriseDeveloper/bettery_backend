import axios from 'axios';
import { path } from "../config/path";
import { limit } from '../config/limits';

export default async (req: any, res: any, next: any) => {
    let userID = req.body.dataFromRedis.id;
    let prodDev = req.body.prodDev

    let query = {
        "select": ['privateEvents/finalAnswer'],
        "where": `privateEvents/host = ${Number(userID)}`,
        "from": "privateEvents"
    }

    let data: any = await axios.post(`${path}/query`, query).catch((err) => {
        res.status(400);
        res.send(err.response.data.message);
        console.log("DB error: " + err.response.data.message)
        return;
    })

    // let's find finised answer

    let filterData = data.data.filter((x: any) => { return x['privateEvents/finalAnswer'] == '' });
    if (filterData.length >= limit && prodDev) {
        res.status(400);
        res.send("Limit is reached");
        return;
    }

    next();
};
