import axios from "axios";
import { path } from "../../config/path";
import { mintTokens } from "../../services/funds/betteryToken";
import "dotenv/config";

const init = async (res: any) => {
  let data: any = await axios
    .post(
      `${process.env.AUTH0_URL}/oauth/token`,
      {
        client_id: process.env.AUTH0_CLIENT_ID,
        client_secret: process.env.AUTH0_SECRET,
        audience: `${process.env.AUTH0_URL}/api/v2/`,
        grant_type: "client_credentials",
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
    .catch((err) => {
      console.log("error get auth0 token", err);
      res.status(400);
      res.send({ status: err });
      return;
    });
  return data.data.access_token;
};

const linkAccount = async (req: any, res: any) => {
  let accessKey = await init(res);
  let firstId = req.body.dataFromRedis.key[0].verifierId;
  let secondId = req.body.verifierId;
  let secondUserId = secondId.substring(secondId.lastIndexOf("|") + 1);
  let verifier = getVerifier(secondId);
  let provider = getProvider(secondId);
  let x = await axios
    .post(
      `${process.env.AUTH0_URL}/api/v2/users/${firstId}/identities`,
      {
        provider: provider,
        user_id:
          provider == "oauth2" ? `${verifier}|${secondUserId}` : secondUserId,
      },
      {
        headers: {
          Authorization: `Bearer ${accessKey}`,
          "Content-Type": "application/json",
        },
      },
    )
    .catch((err) => {
      console.log("from link auth0 ", err);
      res.status(400);
      res.send({ status: err });
      return;
    });
  if (x) {
    let userID = req.body.dataFromRedis.id;
    let linked = [
      {
        _id: userID,
        linkedAccounts: [verifier],
      },
    ];

    let z = await axios.post(`${path}/transact`, linked).catch((err) => {
      console.log("from link auth0 DB ", err);
      res.status(400);
      res.send({ status: err });
      return;
    });
    if (z) {
      let wallet = req.body.dataFromRedis.wallet;
      await mintTokens(wallet, 10, userID, "link account");
      res.status(200);
      res.send({ status: "done" });
    }
  }
};

const getProvider = (x: any) => {
  if (x.search("google-oauth2") != -1) {
    return "google-oauth2";
  } else if (x.search("oauth2") != -1) {
    return "oauth2";
  } else {
    return x.split("|")[0];
  }
};

const getVerifier = (x: any) => {
  if (x.search("google-oauth2") != -1) {
    return "google";
  } else if (x.search("oauth2") != -1) {
    return x.split("|")[1];
  } else {
    return x.split("|")[0];
  }
};

export { linkAccount };
