import { part_bot } from "./part_bot";
import { init_bot, info_bot } from "../init_bot"
import { validEventBot } from "./valid_bot";

export default function Public_bot(app: any) {
    app.post( "/participation_of_bots", async (req: any, res:any) => {
        await part_bot(req, res)
    })

    app.post("/init_bot", async (req: any, res: any) => {
        await init_bot(req, res)
    })

    app.get("/info_bot",async (req: any, res: any) => {
        await info_bot(req, res)
    })

    app.post("/validate_event", async (req: any, res: any) => {
        await validEventBot(req, res)
    })
}
