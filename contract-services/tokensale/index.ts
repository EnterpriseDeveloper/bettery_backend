// @ts-nocheck
import Web3 from "web3";
import "dotenv/config";

import TokenSaleContract from "../abi/QuizeTokenSale.json";
import BetteryTokenContract from "../abi/BTYmain.json"; // TODO rename

export default function TokenSale(app: any) {
  // TODO
  app.post("/tokensale/info", async (req: any, res: any) => {
    let from = req.body.from;
    let provider =
      from == "prod" ? process.env.ETH_NETWORK : process.env.ETH_TEST_NETWORK;
    let networkId: any =
      from == "prod"
        ? process.env.ETH_NETWORK_ID
        : process.env.ETH_TEST_NETWORK_ID;
    let keys =
      from == "prod"
        ? process.env.ETH_PRIVATE_KEY
        : process.env.ETH_TEST_PRIVATE_KEY;

    let tokenMarket = await tokenSale(provider, networkId, keys);
    let tokenSold = await tokenMarket.methods.tokensSold().call();
    let price = await tokenMarket.methods.tokenPrice().call();
    let betteryToken = await BetteryContract(provider, networkId, keys);
    let balance = await betteryToken.methods
      .balanceOf(TokenSaleContract.networks[networkId].address)
      .call();
    let web3 = new Web3();
    res.status(200);
    res.send({
      price: web3.utils.fromWei(price, "mwei"),
      tokenSold: web3.utils.fromWei(tokenSold, "ether"),
      balance: web3.utils.fromWei(balance, "ether"),
      currencyType: "USDT",
    });
  });
}

async function BetteryContract(provider: any, networkId: any, keys: any) {
  let { web3, account } = await connectToContract(provider, keys);
  let abi = BetteryTokenContract.abi;
  let address = BetteryTokenContract.networks[networkId].address;
  return new web3.eth.Contract(abi, address, { from: account });
}

async function tokenSale(provider: any, networkId: any, keys: any) {
  let { web3, account } = await connectToContract(provider, keys);
  let abi = TokenSaleContract.abi;
  let address = TokenSaleContract.networks[networkId].address;
  return new web3.eth.Contract(abi, address, { from: account });
}

async function connectToContract(provider: any, keys: any) {
  let web3 = new Web3(provider);
  const prKey = web3.eth.accounts.privateKeyToAccount("0x" + keys.key);
  await web3.eth.accounts.wallet.add(prKey);
  let accounts = await web3.eth.accounts.wallet;
  let account = accounts[0].address;
  return { web3, account };
}
