import axios from "axios";
import { path } from "../../config/path";
import crypto from "crypto-js";
import { userStructure } from "../../structure/user.struct";
import reputationConvert from "../../helpers/reputationConvert";
import "dotenv/config";

const updateNickname = async (req: any, res: any) => {
  let id = req.body.dataFromRedis.id;
  let name = req.body.newNickName;

  let update = [
    {
      _id: id,
      "users/nickName": name,
    },
  ];

  await axios.post(`${path}/transact`, update).catch((err) => {
    console.log(err);
    res.status(400);
    res.send(err.response.data.message);
    return;
  });
  res.status(200);
  res.send({ name });
};

const updatePublicEmail = async (req: any, res: any) => {
  let id = req.body.dataFromRedis.id;
  let publicEmail = req.body.publicEmail;

  let update = [
    {
      _id: id,
      "users/publicEmail": publicEmail,
    },
  ];

  await axios.post(`${path}/transact`, update).catch((err) => {
    console.log(err);
    res.status(400);
    res.send(err.response.data.message);
    return;
  });
  res.status(200);
  res.send({ publicEmail });
};

const getUserById = (req: any, res: any) => {
  let conf = {
    select: [
      "_id",
      "users/nickName",
      "users/email",
      "users/wallet",
      "users/avatar",
      "users/verifier",
      "users/linkedAccounts",
    ],
    from: Number(req.body.id),
  };

  axios
    .post(path + "/query", conf)
    .then((x) => {
      if (x.data.length != 0) {
        let o = userStructure([x.data[0]]);
        o[0].accessToken = req.body.dataFromRedis.key[0].sessionKey;
        o[0].sessionToken = crypto.AES.encrypt(
          req.body.dataFromRedis.wallet,
          process.env.SECRET_REDIS as string,
        ).toString();
        res.status(200);
        res.send(o);
      } else {
        res.status(400);
        res.send("user do not exist");
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(400);
      res.send(err);
    });
};

const allUsers = (req: any, res: any) => {
  let conf = {
    select: [
      "_id",
      "users/nickName",
      "users/email",
      "users/wallet",
      "users/avatar",
      "users/verifier",
      "users/linkedAccounts",
    ],
    from: "users",
  };

  axios
    .post(path + "/query", conf)
    .then((o) => {
      let result = userStructure(o.data);

      res.status(200);
      res.send(result);
    })
    .catch((err) => {
      res.status(400);
      res.send(err.response.data.message);
    });
};

const additionalInfo = async (req: any, res: any) => {
  let conf = {
    select: [
      "linkedAccounts",
      "publicEmail",
      "advisorReputPoins",
      "playerReputPoins",
      "hostReputPoins",
      "expertReputPoins",
      {
        invitedBy: ["_id", "users/avatar", "users/nickName"],
      },
    ],
    from: Number(req.body.id),
  };

  let data: any = await axios.post(path + "/query", conf).catch((err) => {
    res.status(400);
    res.send(err.response.data.message);
    return;
  });

  // TODO add location, language, share data, public/private email
  let x = data.data[0];
  let user = {
    linkedAccounts: x["linkedAccounts"] == undefined ? [] : x["linkedAccounts"],
    invitedBy:
      x["invitedBy"] == undefined
        ? null
        : {
            id: x["invitedBy"]["_id"],
            nickName: x["invitedBy"]["users/nickName"],
            avatar: x["invitedBy"]["users/avatar"],
          },
    publicEmail: x["publicEmail"] == undefined ? null : x["publicEmail"],
    advisorReputPoins:
      x["advisorReputPoins"] == undefined ? null : x["advisorReputPoins"],
    playerReputPoins:
      x["playerReputPoins"] == undefined ? null : x["playerReputPoins"],
    hostReputPoins:
      x["hostReputPoins"] == undefined ? null : x["hostReputPoins"],
    expertReputPoins: reputationConvert(
      x["expertReputPoins"] == undefined ? null : x["expertReputPoins"],
    ),
  };
  res.status(200);
  res.send(user);
};

const refInfo = async (req: any, res: any) => {
  let userId = req.body.dataFromRedis.id;

  let conf = {
    select: [
      "invited",
      {
        invited: [
          "_id",
          "avatar",
          "nickName",
          "registered",
          "invited",
          {
            invited: [
              "_id",
              "avatar",
              "nickName",
              "registered",
              "invited",
              {
                invited: ["_id", "avatar", "nickName", "registered", "invited"],
              },
            ],
          },
        ],
      },
    ],
    from: userId,
  };

  let data: any = await axios.post(path + "/query", conf).catch((err) => {
    res.status(400);
    res.send(err.response.data.message);
    return;
  });

  let x = data.data[0];

  let level_1 = x && x.invited ? x.invited : [];
  let level_2 = listAtTheLevel(x.invited);
  let level_3 = listAtTheLevel(level_2);

  fakeDateRemoveLater(level_1);
  fakeDateRemoveLater(level_2);
  fakeDateRemoveLater(level_3);

  let dataForSend = {
    level1: level_1.length,
    level2: !level_2 ? 0 : level_2.length,
    level3: !level_3 ? 0 : level_3.length,
    usersInvited: x.invited,
  };
  res.send(dataForSend);
};

const refList = async (req: any, res: any) => {
  let from = req.body.from;
  let to = req.body.to;
  let userId = req.body.dataFromRedis.id;

  let config = {
    select: [
      "invited",
      {
        invited: [
          "_id",
          "invited",
          "publicActivites",
          {
            publicActivites: [
              "eventId",
              {
                eventId: [
                  "question",
                  "finalAnswerNumber",
                  "finishTime",
                  "room",
                  { room: ["name", "color"] },
                  "validatorsAnswer",
                  { validatorsAnswer: ["from"] },
                  "parcipiantsAnswer",
                  {
                    parcipiantsAnswer: [
                      "from",
                      "refAmount1",
                      "refAmount2",
                      "refAmount3",
                    ],
                  },
                ],
              },
            ],
            invited: [
              "_id",
              "invited",
              "publicActivites",
              {
                publicActivites: [
                  "eventId",
                  {
                    eventId: [
                      "question",
                      "finalAnswerNumber",
                      "finishTime",
                      "room",
                      { room: ["name", "color"] },
                      "validatorsAnswer",
                      { validatorsAnswer: ["from"] },
                      "parcipiantsAnswer",
                      {
                        parcipiantsAnswer: [
                          "from",
                          "refAmount1",
                          "refAmount2",
                          "refAmount3",
                        ],
                      },
                    ],
                  },
                ],
                invited: [
                  "_id",
                  "invited",
                  "publicActivites",
                  {
                    publicActivites: [
                      "eventId",
                      {
                        eventId: [
                          "question",
                          "finalAnswerNumber",
                          "finishTime",
                          "room",
                          { room: ["name", "color"] },
                          "validatorsAnswer",
                          { validatorsAnswer: ["from"] },
                          "parcipiantsAnswer",
                          {
                            parcipiantsAnswer: [
                              "from",
                              "refAmount1",
                              "refAmount2",
                              "refAmount3",
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    from: userId,
  };

  let dataDB: any = await axios.post(path + "/query", config).catch((err) => {
    res.status(400);
    res.send(err.response.data.message + "refList");
    return;
  });
  let x = dataDB.data[0];

  let level_1 = x && x.invited ? x.invited : [];
  let level_2 = listAtTheLevel(x.invited);
  let level_3 = listAtTheLevel(level_2);
  let allLevel = [level_1, level_2, level_3].flat();

  const idLevel_1 = [...level_1.map((el: any) => el._id)];
  const idLevel_2 = [...level_2.map((el: any) => el._id)];
  const idLevel_3 = [...level_3.map((el: any) => el._id)];

  const idLevelArr = [idLevel_1, idLevel_2, idLevel_3];

  let allUsers = [...idLevel_1, ...idLevel_2, ...idLevel_3];

  let arrPubActivites = allLevel.map((el: any) => {
    return el.publicActivites == undefined ? [] : el.publicActivites;
  });
  let allList = arrPubActivites.flat();

  let arr = [];
  for (let i = 0; i < allList.length; i++) {
    if (allList[i].eventId.finalAnswerNumber != undefined) {
      arr.push(allList[i].eventId);
    }
  }

  let filterUnique = Array.from(
    new Set(arr.map((obj) => JSON.stringify(obj))),
  ).map((obj2) => JSON.parse(obj2));

  addAdditionalData(filterUnique, allUsers, arr);
  let forSend = {
    totalBet:
      totalRefBET(filterUnique, 1, idLevelArr) +
      totalRefBET(filterUnique, 2, idLevelArr) +
      totalRefBET(filterUnique, 3, idLevelArr),
    totalBet24:
      total24h(filterUnique, 1, idLevelArr) +
      total24h(filterUnique, 2, idLevelArr) +
      total24h(filterUnique, 3, idLevelArr),
    eventsAmount: filterUnique.length,
    data: filterUnique.slice(from, to),
  };
  res.send(forSend);
};

const addAdditionalData = (
  filterUnique: any,
  allUsers: any,
  newAllList: any,
) => {
  return filterUnique.map((el: any) => {
    let count = 0;

    if (el && el.parcipiantsAnswer) {
      el.parcipiantsAnswer.map((o: any) => {
        allUsers.includes(o.from._id)
          ? (o.byMyRef = true)
          : (o.byMyRef = false);
      });
    }

    if (el && el.validatorsAnswer) {
      el.validatorsAnswer.map((o: any) => {
        allUsers.includes(o.from._id)
          ? (o.byMyRef = true)
          : (o.byMyRef = false);
      });
    }

    newAllList.map((el2: any) => {
      el2._id == el._id ? count++ : count;
    });
    el.allReferals = count;
  });
};

const listAtTheLevel = (data: any) => {
  let arr: any = [];
  if (data) {
    data.map((el: any) => {
      if (el.invited) {
        el.invited.map((el2: any) => {
          arr.push(el2);
        });
      }
    });
  }
  return arr;
};

const totalRefBET = (arr: any, param: number, arrId: any) => {
  let total = 0;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].finalAnswerNumber !== undefined) {
      total = calculateTotal(arr[i].parcipiantsAnswer, param, total, arrId);
    }
  }
  return total;
};

const total24h = (arr: any, param: number, arrId: any) => {
  let total24 = 0;
  for (let i = 0; i < arr.length; i++) {
    if (
      arr[i].finishTime &&
      Math.floor(Date.now() / 1000) - arr[i].finishTime < 86400
    ) {
      total24 = calculateTotal(arr[i].parcipiantsAnswer, param, total24, arrId);
    }
  }
  return total24;
};

const calculateTotal = (arr: any, param: number, total: any, arrId: any) => {
  for (let i = 0; i < arr.length; i++) {
    const el = arr[i];
    switch (param) {
      case 1:
        total =
          el.byMyRef &&
          el.refAmount1 != undefined &&
          findLevel(el.from._id, arrId) == 1
            ? total + Number(el.refAmount1)
            : total;
        break;
      case 2:
        total =
          el.byMyRef &&
          el.refAmount2 != undefined &&
          findLevel(el.from._id, arrId) == 2
            ? total + Number(el.refAmount2)
            : total;
        break;
      case 3:
        total =
          el.byMyRef &&
          el.refAmount3 != undefined &&
          findLevel(el.from._id, arrId) == 3
            ? total + Number(el.refAmount3)
            : total;
        break;
      default:
        break;
    }
  }
  return total;
};

const findLevel = (id: any, arr: any) => {
  let level = 0;
  switch (true) {
    case arr[0].includes(id):
      level = 1;
      break;
    case arr[1].includes(id):
      level = 2;
      break;
    case arr[2].includes(id):
      level = 3;
      break;
    default:
      break;
  }

  return level;
};

const fakeDateRemoveLater = (level: []) => {
  if (level.length) {
    level.forEach((el: any) => {
      if (!el.registered) {
        el.registered = 1626261167;
      }
    });
  }
};

export {
  allUsers,
  getUserById,
  additionalInfo,
  updateNickname,
  updatePublicEmail,
  refInfo,
  refList,
};
