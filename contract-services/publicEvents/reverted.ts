import axios from "axios";
import { path } from "../../config/path";

let send: number = 0;

const reverted = async (data: any) => {
    let eventData = data.events.find((x: any)=>{return x.type == "pub.event"})
    let id = eventData.attributes.find((x: any)=>{return x.key == "id"})
    let purpose = eventData.attributes.find((x: any)=>{return x.key == "status"})
    if(Number(id.value) != send){
        send = Number(id.value);
        let revert = [{
            "_id": Number(id.value),
            "status": "reverted:" + purpose.value,
            "eventEnd": Math.floor(new Date().getTime() / 1000.0)
        }]
    
        await axios.post(`${path}/transact`, revert).catch((err: any) => {
            console.log(err);
            return;
        })
    }

}

export {
    reverted
}