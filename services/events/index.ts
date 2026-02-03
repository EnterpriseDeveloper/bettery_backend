import { createEvent, getById, getAll, getAllForTest, getBetteryEvent, createEventID, deleteEvent } from "./publicEvents";
import {
    createPrivateEvent,
    createPrivateEventID,
    deletePrivateEvent,
    privGetById,
    privParticipate,
    privValidate
} from "./privateEvents";
import { getAllHashtags } from "./hashtags";
import { participate, validate } from "./publicActivites";
import eventLimitPrivate from '../../middlewares/eventLimitsPrivate'
import eventLimitPublic from '../../middlewares/eventLimitsPublic'
import { setRevertEvent } from "./revert";
import { sendToBlockChain } from "../../contract-services/publicEvents/findCorrectAnswer"
import userAnswerMiddleware from "../../middlewares/find-user-answer";
import checkToken from '../../middlewares/check-token'

export default function Events(app: any) {
    app.get("/publicEvents/create_event_id", checkToken, async (req: any, res: any) => {
        createEventID(req, res);
    })

    app.post("/publicEvents/delete_event_id", checkToken, async (req: any, res: any) => {
        deleteEvent(req, res);
    })

    app.post("/publicEvents/createEvent", checkToken, async (req: any, res: any) => {
        createEvent(req, res);
    })

    app.post("/publicEvents/get_by_id", userAnswerMiddleware, async (req: any, res: any) => {
        getById(req, res);
    })

    app.post("/publicEvents/get_all", userAnswerMiddleware, async (req: any, res: any) => {
        getAll(req, res);
    })

    app.get("/publicEvents/get_all_for_test", async (req: any, res: any) => {
        getAllForTest(req, res);
    })

    app.post("/publicEvents/participate", checkToken, async (req: any, res: any) => {
        participate(req, res);
    })

    app.post("/publicEvents/validate", checkToken, async (req: any, res: any) => {
        validate(req, res);
    })

    app.post("/privateEvents/createEvent", checkToken, async (req: any, res: any) => {
        createPrivateEvent(req, res);
    })

    app.post("/privateEvents/get_by_id", async (req: any, res: any) => {
        privGetById(req, res);
    })
    app.post("/privateEvents/participate", checkToken, async (req: any, res: any) => {
        privParticipate(req, res);
    })
    app.post("/privateEvents/validate", checkToken, async (req: any, res: any) => {
        privValidate(req, res);
    })

    app.get("/hashtags/get_all", async (req: any, res: any) => {
        getAllHashtags(req, res);
    })

    app.post("/publicEvents/revert", async (req: any, res: any) => {
        setRevertEvent(req, res);
    })

    app.post("/bettery_event", async (req: any, res: any) => {
        getBetteryEvent(req, res)
    })

    app.post("/public_event/finishEvent", async (req: any, res: any) => {
        let id = req.body.id

        await sendToBlockChain(Number(id));
        res.status(200);
        res.send({ status: "OK" });
    })

    app.get("/privateEvents/create_event_id", checkToken, async (req: any, res: any) => {
        await createPrivateEventID(req, res);
    })

    app.post("/privateEvents/delete_event_id", checkToken, async (req: any, res: any) => {
        deletePrivateEvent(req, res);
    })
}
