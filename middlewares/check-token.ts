import crypto from "crypto-js";
import redis from "../helpers/redis-helper";
import "dotenv/config";

export default async (req: any, res: any, next: any) => {
  try {
    const sessionToken = req.get("Authorization");
    const accessToken = req.get("Cookies");

    if (!sessionToken || !accessToken) {
      return next(res.send("no token"), 400);
    }

    const bytes = crypto.AES.decrypt(
      sessionToken,
      process.env.SECRET_REDIS as string,
    );
    const decryptedData = bytes.toString(crypto.enc.Utf8);

    const fromRedis = await redis.getFromRedis(decryptedData);

    if (!fromRedis) {
      return next(res.send("not valid token"), 400);
    }

    fromRedis.key.forEach((el: any) => {
      if (el.sessionKey === accessToken) {
        el.lastUpdated = Date.now();
      }
    });

    redis.updateLastUpdate(decryptedData, fromRedis);

    const data = fromRedis.key.filter((el: any) => {
      return el.sessionKey === accessToken;
    });
    if (!data.length) {
      return next(res.send("not valid token"));
    }
    fromRedis.key = data;
    req.body = req.body ?? {};
    req.body.dataFromRedis = fromRedis;
    next();
  } catch (e: any) {
    res.send(e.message);
    next(e);
  }
};
