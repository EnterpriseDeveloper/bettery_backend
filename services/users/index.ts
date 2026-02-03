import { getUserById, allUsers, additionalInfo, updateNickname, updatePublicEmail, refInfo, refList } from "./users";
import { authLogin, authRegister, autoLogin, logout } from "./torusRegist";
import { getAllUserEvents } from "./myActivites";
import { linkAccount } from "../../helpers/auth0/linkAccount";
import authMiddleware from "../../middlewares/check-token";
import { checkIsTokenValid } from "../../middlewares/check-is-token-valid";

export default function Users(app: any) {
    app.post("/user/getUserById", authMiddleware, async (req: any, res: any) => {
        getUserById(req, res);
    })

    app.get("/user/all", async (req: any, res: any) => {
        allUsers(req, res);
    })

    // todo middleware checkTokenVerify
    app.post("/user/auth0_login", async (req: any, res: any) => {
        authLogin(req, res)
    })

    app.post("/user/auth0_register", async (req: any, res: any) => {
        authRegister(req, res)
    })

    app.post("/user/event_activites", async (req: any, res: any) => {
        await getAllUserEvents(req, res);
    })

    app.post("/user/get_additional_info", async (req: any, res: any) => {
        await additionalInfo(req, res)
    })

    app.post("/user/link_account", authMiddleware, async (req: any, res: any) => {
        await linkAccount(req, res);
    })

    app.post("/user/update_nickname", authMiddleware, async (req: any, res: any) => {
        await updateNickname(req, res)
    })

    app.post("/user/update_public_email", authMiddleware, async (req: any, res: any) => {
        await updatePublicEmail(req, res)
    })

    app.post("/user/auto_login", async (req: any, res: any) => {
        await autoLogin(req, res);
    })

    app.get("/user/logout", authMiddleware, async (req: any, res: any) => {
        await logout(req, res);
    })

    app.get("/user/delete_account", async (req: any, res: any) => {
        // TODO
        res.status(200);
        res.send({ status: "ok" })
    })

    app.get("/user/ref_info", authMiddleware, async (req: any, res: any) => {
        await refInfo(req, res)
    })

    app.post("/user/ref_list", authMiddleware, async (req: any, res: any) => {
        await refList(req, res)
    })
}
