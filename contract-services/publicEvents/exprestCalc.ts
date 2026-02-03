import axios from "axios";
import { path } from "../../config/path";

var send: number = 0;
const expertCalc = async (data: any) => {
    let eventData = data.events.find((x: any) => { return x.type == "pub.event" })
    console.log("from expertCalc", eventData)
    let id = eventData.attributes.find((x: any) => { return x.key == "id" })
    if (Number(id.value) != send) {
        let expertsAmount = eventData.attributes.find((x: any) => { return x.key == "experts" })

        let send = [{
            "_id": Number(id.value),
            "validatorsAmount": Number(expertsAmount.value)
        }]
        await axios.post(`${path}/transact`, send).catch((err) => {
            console.log("err from DB calclucation oracels: " + err.response.data.message)
            return;
        })
    }
}

export {
    expertCalc
}