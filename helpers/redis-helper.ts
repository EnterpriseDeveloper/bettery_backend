import { createClient } from "redis";
import "dotenv/config";

const secretRedisForAllKey = process.env.SECRET_REDIS_FOR_ALL_KEY as string;
const redisUrl = process.env.REDIS_URL as string;
const client = createClient({ url: redisUrl });

client.on("error", function (error: any) {
  console.error(error);
});

// Connect to Redis
client.connect().catch(console.error);

const sendToRedis = async (key: any, data: any) => {
  try {
    const reply = await client.get(key);
    let fromRedisParse;
    if (reply) {
      fromRedisParse = JSON.parse(reply);
    }

    if (fromRedisParse) {
      fromRedisParse.key.push(data.key[0]);
      const dataToString = JSON.stringify(fromRedisParse);
      await client.set(key, dataToString);
    } else {
      const dataToString = JSON.stringify(data);
      await client.set(key, dataToString);
    }
  } catch (error) {
    console.error("Error in sendToRedis:", error);
  }
};

const updateLastUpdate = async (key: any, data: any) => {
  try {
    const result = JSON.stringify(data);
    await client.set(key, result);
  } catch (error) {
    console.error("Error in updateLastUpdate:", error);
  }
};

const getFromRedis = async (key: any) => {
  try {
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (e) {
    console.log(`Redis get error:`, e);
    return null;
  }
};

const deleteFromRedis = async (key: any, sessionKey: any) => {
  try {
    const reply = await client.get(key);
    let fromRedisParse;

    if (reply) {
      fromRedisParse = JSON.parse(reply);
      fromRedisParse.key = fromRedisParse.key.filter((el: any) => {
        return el.sessionKey !== sessionKey;
      });

      if (!fromRedisParse.key.length) {
        await client.del(key);
        await client.lRem(secretRedisForAllKey, 0, key);
      } else {
        const dataToString = JSON.stringify(fromRedisParse);
        await client.set(key, dataToString);
      }
    }
  } catch (error) {
    console.error("Error in deleteFromRedis:", error);
  }
};

const redisDataStructure = (userStruct: any, req: any) => {
  return {
    email: userStruct[0].email,
    wallet: userStruct[0].wallet,
    id: userStruct[0]._id,
    key: [
      {
        lastUpdated: Date.now(),
        dateCreation: Date.now(),
        sessionKey: req.body.accessToken,
        typeOfLogin: userStruct[0].verifier,
        verifierId: req.body.verifierId,
      },
    ],
  };
};

const saveKeyRedisDB = async (data: any) => {
  try {
    const allItems = await client.lRange(secretRedisForAllKey, 0, -1);
    if (allItems.indexOf(data) === -1) {
      await client.rPush(secretRedisForAllKey, data);
    }
  } catch (e) {
    console.log(e, "error redis send");
  }
};

const botRedisCleaner = async () => {
  try {
    const allItems = await client.lRange(secretRedisForAllKey, 0, -1);
    for (const element of allItems) {
      let userDetectKey;
      let userDetect = await getFromRedis(element);

      if (userDetect) {
        userDetectKey = userDetect.key;
        let now = Date.now();
        let day30 = 2592000000;

        let clearingData = userDetectKey.filter((el: any) => {
          return now - el.lastUpdated < day30;
        });

        if (clearingData.length > 0) {
          userDetect.key = clearingData;
          const dataToString = JSON.stringify(userDetect);
          await client.set(element, dataToString);
        } else {
          await client.del(element);
          await client.lRem(secretRedisForAllKey, 0, element);
        }
      }
    }
  } catch (e) {
    console.log(e, "error redis send");
  }
};

export default {
  sendToRedis,
  updateLastUpdate,
  getFromRedis,
  deleteFromRedis,
  redisDataStructure,
  saveKeyRedisDB,
};
