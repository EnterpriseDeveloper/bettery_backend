import { DirectSecp256k1HdWallet, Registry } from "@cosmjs/proto-signing";
import { SigningStargateClient } from "@cosmjs/stargate";
import { MsgCreateMintBet } from "./funds/tx";
import {
  MsgCreateFihishPubEvent,
  MsgCreateRefPubEvents,
  MsgCreateRefundPubEvents,
} from "./publicEvents/tx";
import { demonAPI } from "../config/path";
import "dotenv/config";

const types = [
  ["/bettery.funds.v1.MsgCreateMintBet", MsgCreateMintBet],
  [
    "/VoroshilovMax.bettery.publicevents.MsgCreateFihishPubEvent",
    MsgCreateFihishPubEvent,
  ],
  [
    "/VoroshilovMax.bettery.publicevents.MsgCreateRefPubEvents",
    MsgCreateRefPubEvents,
  ],
  [
    "/VoroshilovMax.bettery.publicevents.MsgCreateRefundPubEvents",
    MsgCreateRefundPubEvents,
  ],
];

const registry = new Registry(<any>types);

const connectToSign = async () => {
  const memonic = process.env.COSMOS_MEMO as string;
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(memonic);

  let addr = `${demonAPI}:26657`;
  const [{ address }] = await wallet.getAccounts();
  const client = await SigningStargateClient.connectWithSigner(addr, wallet, {
    registry,
  });
  return { memonic, address, client };
};

export { connectToSign };
