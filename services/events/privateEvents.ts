import axios from "axios";
import { path } from "../../config/path";
import { createRoom } from "../rooms/createRoom";
import { privateEventStructure } from "../../structure/event.struct";
import { uploadImage } from "../../helpers/helpers";
import { getRoomColor } from "../rooms/getRoom";
import "dotenv/config";

const createPrivateEventID = async (req: any, res: any) => {
  let createEventID = [
    {
      _id: "privateEvents$newEvents",
      status: "id created",
    },
  ];
  const eventData: any = await axios
    .post(`${path}/transact`, createEventID)
    .catch((err) => {
      console.log("DB error: " + err.response.data.message);
      res.status(400);
      res.send(err.response.data.message);
      return;
    });

  let id = eventData.data.tempids["privateEvents$newEvents"];
  res.status(200);
  res.send({ id: id });
};

const deletePrivateEvent = (req: any, res: any) => {
  //? same as in publicEvents
  // TODO check status before deleting
  let id = req.body.id;
  let removeEvent = [
    {
      _id: id,
      _action: "delete",
    },
  ];
  axios.post(`${path}/transact`, removeEvent).catch((err) => {
    console.log("DB error: " + err.response.data.message);
    res.status(400);
    res.send(err.response.data.message);
    return;
  });
  res.status(200);
  res.send({ status: "ok" });
};

const createPrivateEvent = async (req: any, res: any) => {
  let allData = req.body;
  allData.host = allData.dataFromRedis.id;
  delete allData.dataFromRedis;
  let id = req.body._id;
  allData.status = "deployed";
  allData._id = id;
  allData.finalAnswer = "";
  allData.dateCreation = Math.floor(Date.now() / 1000);

  if (req.body.thumImage !== "undefined") {
    let type = await uploadImage(req.body.thumImage, id);
    let url =
      process.env.NODE_ENV == "production"
        ? "https://api.bettery.io"
        : `https://apitest.bettery.io`;
    allData.thumImage = `${url}/image/${id}.${type}`;
    allData.thumColor = undefined;
  } else if (req.body.thumColor !== "undefined") {
    allData.thumImage = undefined;
  } else if (
    req.body.thumColor === "undefined" &&
    req.body.thumImage === "undefined"
  ) {
    allData.thumImage = undefined;
    if (req.body.whichRoom == "new") {
      allData.thumColor = req.body.roomColor;
    } else {
      allData.thumColor = await getRoomColor(allData.roomId);
    }
  }

  if (req.body.thumFinish) {
    if (req.body.thumFinish.length > 12) {
      let name = `${id}_finished`;
      let type = await uploadImage(req.body.thumFinish, name);
      let url =
        process.env.NODE_ENV == "production"
          ? "https://api.bettery.io"
          : `https://apitest.bettery.io`;
      allData.thumFinish = `${url}/image/${name}.${type}`;
    } else {
      allData.thumFinish = undefined;
    }
  }

  delete allData.prodDev;
  let data;
  if (req.body.whichRoom == "new") {
    let room = createRoom(allData, "privateEventsId");
    allData.room = [room._id];
    delete allData.roomName;
    delete allData.roomColor;
    delete allData.whichRoom;
    delete allData.roomId;
    data = [room, allData];
  } else {
    let room = {
      _id: Number(allData.roomId),
      privateEventsId: [Number(allData._id)],
    };
    allData.room = [Number(allData.roomId)];
    delete allData.roomName;
    delete allData.roomColor;
    delete allData.whichRoom;
    delete allData.roomId;
    data = [room, allData];
  }

  // ADD to host
  let hostData = {
    _id: allData.host,
    hostPrivateEvents: [id],
  };

  data.push(hostData);
  let eventData: any = await axios
    .post(`${path}/transact`, data)
    .catch((err: any) => {
      console.log("DB error: " + err.response.data.message);
      res.status(400);
      res.send(err.response.data.message);
    });
  let transactionHash = req.body.transactionHash;

  // ADD transaction
  let transactionData = [
    {
      _id: id,
      transactionHash: transactionHash,
    },
  ];
  await axios.post(`${path}/transact`, transactionData).catch((err: any) => {
    console.log("DB error: " + err.response.data.message);
    res.status(400);
    res.send(err.response.data.message);
  });

  res.status(200).send({ id: id });
};

const privParticipate = async (req: any, res: any) => {
  let eventId = Number(req.body.eventId);
  let answer = Number(req.body.answer);
  let from = req.body.dataFromRedis.id;
  if (eventId == undefined || answer == undefined || from == undefined) {
    res.status(400);
    res.send({ error: "structure is incorrect" });
  } else {
    // private action structure
    let data: any = [
      {
        _id: "privateActivites$newEvents",
        eventId: eventId,
        date: Math.floor(Date.now() / 1000),
        answer: answer,
        transactionHash: req.body.transactionHash,
        from: from,
        role: "participate",
      },
    ];
    // add to user table
    data.push({
      _id: from,
      privateActivites: ["privateActivites$newEvents"],
    });
    // add to event
    data.push({
      _id: eventId,
      parcipiantsAnswer: ["privateActivites$newEvents"],
    });
    await axios.post(`${path}/transact`, data).catch((err: any) => {
      res.status(400);
      res.send(err.response.data.message);
      console.log("DB error: " + err.response.data.message);
      return;
    });
    res.status(200);
    res.send({ done: "ok" });
  }
};

const privValidate = async (req: any, res: any) => {
  let eventId = Number(req.body.eventId);
  let answer = req.body.answer;
  let answerNumber = Number(req.body.answerNumber);
  let from = Number(req.body.dataFromRedis.id);
  if (
    eventId == undefined ||
    answer == undefined ||
    from == undefined ||
    answerNumber == undefined
  ) {
    res.status(400);
    res.send({ error: "structure is incorrect" });
  } else {
    // private action structure
    let data: any = [
      {
        _id: "privateActivites$newEvents",
        eventId: eventId,
        date: Math.floor(Date.now() / 1000),
        answer: answerNumber,
        transactionHash: req.body.transactionHash,
        from: from,
        role: "validate",
      },
    ];
    // add to user table
    data.push({
      _id: from,
      privateActivites: ["privateActivites$newEvents"],
    });
    // add to event
    data.push({
      _id: eventId,
      validatorAnswer: "privateActivites$newEvents",
      finalAnswerNumber: answerNumber,
      finalAnswer: answer,
    });
    axios
      .post(path + "/transact", data)
      .then(() => {
        res.status(200);
        res.send({ done: "ok" });
      })
      .catch((err: any) => {
        res.status(400);
        res.send(err.response.data.message);
        console.log("DB error: " + err.response.data.message);
      });
  }
};

const privGetById = async (req: any, res: any) => {
  let id = Number(req.body.id);
  if (!id) {
    res.status(400);
    res.send({ error: "do not have id" });
  } else {
    let conf = {
      select: [
        "*",
        {
          "privateEvents/parcipiantsAnswer": [
            "*",
            { "privateActivites/from": ["*"] },
          ],
        },
        {
          "privateEvents/validatorAnswer": [
            "*",
            { "privateActivites/from": ["*"] },
          ],
        },
        { "privateEvents/host": ["*"] },
        { "privateEvents/room": ["*"] },
      ],
      from: id,
    };

    let event = await axios.post(path + "/query", conf).catch((err: any) => {
      res.status(400);
      res.send(err.response.data);
      console.log("DB error: " + err.response.data);
    });
    if (event) {
      if (event.data.length != 0) {
        let obj = privateEventStructure([event.data[0]]);
        res.status(200);
        res.send(obj[0]);
      } else {
        res.status(404);
        res.send({ error: "event not found" });
      }
    }
  }
};

export {
  createPrivateEvent,
  privGetById,
  privParticipate,
  privValidate,
  createPrivateEventID,
  deletePrivateEvent,
};
