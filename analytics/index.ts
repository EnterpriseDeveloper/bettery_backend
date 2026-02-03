import {analytics24h, analyticsByEventId, usersAmount, checkBalance} from "./analitics";

export default function Analytics(app: any) {

    app.get('/analytics/previous_day', async (req: any, res: any) => {
        await analytics24h(req, res)
    })

    app.get('/analytics/users_amount', async (req: any, res: any) => {
        await usersAmount(req, res)
    })

    app.post('/analytics/check_balance', async (req: any, res: any) => {
        await checkBalance(req, res)
    })

    app.post('/analytics/eventById', async (req: any, res: any) => {
        await analyticsByEventId(req, res)
    })
}
