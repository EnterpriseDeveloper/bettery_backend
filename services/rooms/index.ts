import { getByUserId, roomValidation, getAllRooms, getJoinedRoom } from './getRoom';
import { getEventByRoomId, roomInfo } from './roomEvent';
import { joinToRoom, leaveRoom } from './createRoom';
import { subscribeToNotification, getNotificationByUserId, deleteNotifications, readNotification } from './notification';
import checkToken from '../../middlewares/check-token';
import userAnswerMiddleware from "../../middlewares/find-user-answer";


export default function Rooms(app: any) {
    app.get("/room/get_by_user_id", checkToken, async (req: any, res: any) => {
        getByUserId(req, res);
    })
    app.post("/room/validation", checkToken, async (req: any, res: any) => {
        roomValidation(req, res);
    })
    app.post("/room/get_event_by_room_id",userAnswerMiddleware, async (req: any, res: any) => {
        getEventByRoomId(req, res);
    })
    app.post("/room/info", async (req: any, res: any) => {
        roomInfo(req, res);
    })
    app.get("/room/get_all", async (req: any, res: any) => {
        getAllRooms(req, res);
    })
    app.post("/room/join", checkToken, async (req: any, res: any) => {
        joinToRoom(req, res);
    })
    app.post("/room/leave", checkToken, async (req: any, res: any) => {
        leaveRoom(req, res);
    })
    app.post("/room/notification", checkToken, async (req: any, res: any) => {
        subscribeToNotification(req, res);
    })
    app.get("/room/joined", checkToken, async (req: any, res: any) => {
        getJoinedRoom(req, res);
    })
    app.get("/notification/get_by_user_id", checkToken, (req: any, res: any) => {
        getNotificationByUserId(req, res);
    })
    app.post("/notification/read", checkToken, async (req: any, res: any) => {
        readNotification(req, res);
    })
    app.post("/notification/delete", checkToken, async (req: any, res: any) => {
        deleteNotifications(req, res);
    })
}
