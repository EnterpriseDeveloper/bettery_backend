import axios from "axios";
import "dotenv/config";

const prerenderNode = (param: string, id: string) => {
  let url = process.env.PRERENDER_URL + "/" + param;

  let data = {
    prerenderToken: process.env.PRERENDER_TOKEN,
    url: `${url}/${id}`,
  };

  axios.post("https://api.prerender.io/recache", data).catch((err) => {
    console.log(`Error from preview link:${err}`);
  });
};

export { prerenderNode };
