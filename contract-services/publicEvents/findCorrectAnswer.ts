import { connectToSign } from '../../contract-services/connectToChain';
import { mintTokenOnCrowdedEvent } from '../funds/mint';

let send: number = 0;
const findCorrectAnswer = async (data: any) => {
    let eventData = data.events.find((x: any) => { return x.type == "pub.event" })
    let id = eventData.attributes.find((x: any) => { return x.key == "id" })
    if (Number(id.value) != send) {
        sendToBlockChain(Number(id.value))
    }
}

const sendToBlockChain = async (id: number) => {
    let { memonic, address, client } = await connectToSign()

    const msg = {
        typeUrl: "/VoroshilovMax.bettery.publicevents.MsgCreateFihishPubEvent",
        value: {
            creator: address,
            pubId: id
        }
    };
    const fee = {
        amount: [],
        gas: "100000000000000000000",
    };
    try {
        let tx: any = await client.signAndBroadcast(address, [msg], fee, memonic);
        console.log("from sendToBlockChain", tx.code, tx.transactionHash);
        mintTokenOnCrowdedEvent(id);
    } catch (err) {
        console.log(err)
    }
}


export {
    findCorrectAnswer,
    sendToBlockChain
}