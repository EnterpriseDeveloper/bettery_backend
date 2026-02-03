import { demonAPI } from "../config/path";
import { SigningStargateClient } from "@cosmjs/stargate";
import { DirectSecp256k1HdWallet, Registry } from "@cosmjs/proto-signing";

const connectToSign = async (memonic: string, types: any) => {
    const registry = new Registry(<any>types);

    if (memonic) {
        const wallet = await DirectSecp256k1HdWallet.fromMnemonic(
            memonic
        );

        let addr = `${demonAPI}:26657`;
        const [{ address }] = await wallet.getAccounts();
        const client = await SigningStargateClient.connectWithSigner(addr, wallet, { registry });
        return { memonic, address, client }
    } else {
        console.log("error getting memonic")
    }
}

export {
    connectToSign
}