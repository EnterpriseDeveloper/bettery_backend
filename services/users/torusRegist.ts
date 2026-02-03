import axios from "axios";
import crypto from "crypto-js";
import { path } from "../../config/path";

import { mintTokens } from "../funds/betteryToken";
import { userStructure } from "../../structure/user.struct";
import redis from "../../helpers/redis-helper";
import "dotenv/config";
const authLogin = async (req: any, res: any) => {
  let email = req.body.email;
  let nickName = req.body.nickname;
  let pubKeyFromLS = req.body.pubKey;
  let verifierId = getVerifier(req.body.verifierId);

  let findEmail = {
    select: [
      "_id",
      "users/nickName",
      "users/email",
      "users/wallet",
      "users/avatar",
      "users/verifier",
      "users/linkedAccounts",
    ],
    from: email ? ["users/email", email] : ["users/nickName", nickName],
  };
  let user: any = await axios.post(`${path}/query`, findEmail).catch((err) => {
    console.log(err);
    res.status(400);
    res.send(err.response.data.message);
    return;
  });
  if (user.data.length === 0) {
    res.send();
  } else {
    !pubKeyFromLS ? (pubKeyFromLS = req.body.pubKeyActual) : false;

    if (user.data[0]["users/wallet"] != pubKeyFromLS || !pubKeyFromLS) {
      //? not valid
      res.send({
        walletVerif: "failure",
        wallet: user.data[0]["users/wallet"],
      });
    }
    if (user.data[0]["users/wallet"] == pubKeyFromLS) {
      //? valid

      let wallet = pubKeyFromLS;

      //todo send user data

      let userStruct = userStructure(user.data);
      if (
        userStruct[0].linkedAccounts.length != 0 &&
        !userStruct[0].linkedAccounts.includes(verifierId)
      ) {
        //check if account exist return error
        let data = {
          email: userStruct[0].email,
          linkedAccounts: userStruct[0].linkedAccounts,
        };
        res.status(302);
        res.send(data);
      } else {
        let dataToRedis = redis.redisDataStructure(userStruct, req);

        userStruct[0].sessionToken = dataRedisSend(
          userStruct[0].wallet,
          dataToRedis,
        );
        userStruct[0].accessToken = req.body.accessToken;
        userStruct[0].walletVerif = "success";

        res.status(200);
        res.send(userStruct[0]);
      }
    }
  }
};
const authRegister = async (req: any, res: any) => {
  let wallet = req.body.wallet;
  let email = req.body.email;
  let nickName = req.body.nickName;
  let verifierId = getVerifier(req.body.verifierId);

  let refId = req.body.refId;

  let data: any = [
    {
      _id: "users$newUser",
      nickName: nickName,
      email: email,
      wallet: wallet,
      registered: Math.floor(Date.now() / 1000),
      avatar:
        req.body.avatar == ""
          ? "https://api.bettery.io/image/avatar.png"
          : req.body.avatar,
      verifier: req.body.verifierId,
      linkedAccounts: [verifierId],
    },
  ];

  if (!isNaN(refId)) {
    let findByref = await checkUserById(refId, res);
    if (findByref) {
      ((data[0].invitedBy = Number(refId)),
        data.push({
          _id: Number(refId),
          invited: ["users$newUser"],
        }));
    }
  }
  let x: any = await axios.post(`${path}/transact`, data).catch((err) => {
    res.status(400);
    res.send(err.response.data.message);
    return;
  });

  let userID = x.data.tempids["users$newUser"];

  await mintTokens(wallet, 10, userID, "registration");
  // // TODO add session token from Redis
  const dataFromRedis = [
    {
      email: email ? email : "undefined",
      wallet: req.body.wallet,
      _id: userID,
      typeOfLogin: req.body.verifierId,
    },
  ];
  let dataToRedis = redis.redisDataStructure(dataFromRedis, req);

  let sessionToken = dataRedisSend(String(wallet), dataToRedis);

  res.status(200);
  res.send({
    _id: x.data.tempids["users$newUser"],
    nickName: req.body.nickName,
    email: email,
    wallet: req.body.wallet,
    avatar: req.body.avatar,
    verifierId: req.body.verifierId,
    sessionToken: sessionToken,
    accessToken: req.body.accessToken,
  });
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

const autoLogin = async (req: any, res: any) => {
  let wallet = req.body.wallet;
  let accessToken = req.body.accessToken;

  let detectUser = await redis.getFromRedis(wallet);
  if (detectUser == null) {
    res.status(400);
    res.send("not valid token");
    return;
  } else {
    if (
      detectUser.key.find((x: any) => {
        return x.sessionKey == accessToken;
      }) == undefined
    ) {
      res.status(400);
      res.send("not valid token");
      return;
    } else {
      let findUser = {
        select: [
          "_id",
          "users/nickName",
          "users/email",
          "users/wallet",
          "users/avatar",
          "users/verifier",
          "users/linkedAccounts",
        ],
        from: ["users/wallet", wallet],
      };

      let user: any = await axios
        .post(`${path}/query`, findUser)
        .catch((err) => {
          res.status(400);
          res.send(err.response.data.message);
        });

      let o = userStructure(user.data);
      o[0].accessToken = accessToken;
      o[0].sessionToken = crypto.AES.encrypt(
        wallet,
        process.env.SECRET_REDIS as string,
      ).toString();
      res.status(200);
      res.send(o[0]);
    }
  }
};

const logout = async (req: any, res: any) => {
  let wallet = req.body.dataFromRedis.wallet;
  let accessToken = req.body.dataFromRedis.key[0].sessionKey;
  try {
    await redis.deleteFromRedis(wallet, accessToken);
    res.status(200);
    res.send({});
  } catch (e) {
    res.status(400);
    res.send(e, "error logout");
  }
};

const checkUserById = async (id: any, res: any) => {
  let findUser = {
    select: ["*"],
    from: Number(id),
  };

  let user: any = await axios.post(`${path}/query`, findUser).catch((err) => {
    res.status(400);
    res.send(err.response.data.message);
    return;
  });

  return user.data.length === 0 ? false : true;
};

const dataRedisSend = (wallet: any, dataToRedis: any) => {
  redis.sendToRedis(wallet, dataToRedis);
  redis.saveKeyRedisDB(wallet);
  return crypto.AES.encrypt(
    wallet,
    process.env.SECRET_REDIS as string,
  ).toString();
};

export { authLogin, authRegister, autoLogin, logout };
