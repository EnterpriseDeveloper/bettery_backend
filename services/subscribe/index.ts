import { emailSub } from "./subscribe";

export default function Subscribe(app: any) {
    app.post("/subscribe", async (req: any, res: any) => {
        emailSub(req, res);
    })
}