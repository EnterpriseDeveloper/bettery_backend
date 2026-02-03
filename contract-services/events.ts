const { RpcClient } = require("tendermint");
import { findCorrectAnswer, reverted, expertCalc } from "./publicEvents/index";

import { usersPayment } from "./publicEvents/usersPayment";
import "dotenv/config";

function loadHandler() {
  const demonPath = process.env.COSMOS_DEMON as string;
  pubEventReverted(demonPath);
  pubLetsFinishEvent(demonPath);
  pubEventCalcExpert(demonPath);
  pubEventFinished(demonPath);
}

function pubEventReverted(demonPath: string) {
  let client = RpcClient(`ws://${demonPath}:26657/websocket`);
  client.subscribe(
    { query: "pub.event.reverted = \'true\'" },
    (event: any, err: any) => {
      if (err) {
        console.log("pubEvents reverted", err);
      }
      let data = JSON.parse(event.TxResult.result.log);
      reverted(data[0]);
    },
  );
}

function pubLetsFinishEvent(demonPath: string) {
  let client = RpcClient(`ws://${demonPath}:26657/websocket`);
  client.subscribe(
    { query: "pub.event.letfinishevent = \'true\'" },
    (event: any, err: any) => {
      if (err) {
        console.log("pubEvents reverted", err);
      }
      let data = JSON.parse(event.TxResult.result.log);
      setTimeout(() => {
        findCorrectAnswer(data[0]);
      }, 3000);
    },
  );
}

function pubEventCalcExpert(demonPath: string) {
  let client = RpcClient(`ws://${demonPath}:26657/websocket`);
  client.subscribe(
    { query: "pub.event.calculateExpert = \'true\'" },
    (event: any, err: any) => {
      if (err) {
        console.log("pubEvents reverted", err);
      }
      let data = JSON.parse(event.TxResult.result.log);
      expertCalc(data[0]);
    },
  );
}

async function pubEventFinished(demonPath: string) {
  let client = RpcClient(`ws://${demonPath}:26657/websocket`);
  client.subscribe(
    { query: "pub.event.finished = \'true\'" },
    (event: any, err: any) => {
      if (err) {
        console.log("pubEvents finished", err);
      }
      usersPayment(event);
    },
  );
}

export { loadHandler };
