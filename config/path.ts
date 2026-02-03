import "dotenv/config";

const path = `http://${process.env.FLUREE_DB}/fdb/demo/quize`;
const demonAPI = `http://${process.env.COSMOS_DEMON}`;

export { path, demonAPI };
