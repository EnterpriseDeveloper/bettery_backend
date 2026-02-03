import { setInitWithd } from "./withdrawal";
import { getBTYToken } from './betteryToken';
import { getTokens } from './userTokens'
import checkToken from '../../middlewares/check-token';

export default function Funds(app: any) {

    app.post("/withdrawal/init", async (req: any, res: any) => {
        setInitWithd(req, res);
    })

    app.get("/withdrawal/exit", checkToken, async (req: any, res: any) => {
        setInitWithd(req, res);
    })

    app.post("/tokens/bty", async (req: any, res: any) => {
        getBTYToken(req, res);
    })

    app.get("/users/getBalance", checkToken, async (req: any, res: any) => {
        getTokens(req, res);
    })
}
