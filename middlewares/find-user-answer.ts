import crypto from "crypto-js";
import redis from "../helpers/redis-helper";
import "dotenv/config";

export default async (req: any, res: any, next: any) => {
  try {
    const sessionToken = req.get("Authorization");
    if (!sessionToken) {
      return next();
    }

    const bytes = crypto.AES.decrypt(
      sessionToken,
      process.env.SECRET_REDIS as string,
    );
    const decryptedData = bytes.toString(crypto.enc.Utf8);

    const fromRedis = await redis.getFromRedis(decryptedData);

    if (!fromRedis) {
      return next();
    }
    req.body.userId = fromRedis.id;
    next();
  } catch (e: any) {
    res.send(e.message);
    console.log(e + "find-user-answer middleware");
  }
};
