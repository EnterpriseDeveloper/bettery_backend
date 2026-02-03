import { getAllCommentsById } from './getComments';
import { createComment, replyToComment } from './createComments';
import { iconActivities } from './activities';

export default function Comments(io: any) {
    io.on('connection', (socket: any) => {
        socket.on('get comments', async (eventId: any) => {
            socket.join(eventId);
            io.to(eventId).emit('receive comments', await getAllCommentsById(eventId));
        });

        socket.on('create comment', async (msg: any) => {
            let eventId = msg.eventId
            socket.join(eventId);
            await createComment(msg)
            io.to(eventId).emit('receive comments', await getAllCommentsById(eventId));
        })

        socket.on("activities", async (msg: any) => {
            let eventId = msg.eventId
            socket.join(eventId);
            await iconActivities(msg)
            io.to(eventId).emit('receive comments', await getAllCommentsById(eventId));
        });

        socket.on("typing in", async (msg: any) => {
            let eventId = msg.eventId
            socket.join(eventId);
            socket.broadcast.to(eventId).emit('typing out', msg.text);
        })

        socket.on("reply", async (msg: any) => {
            let eventId = msg.eventId
            socket.join(eventId);
            await replyToComment(msg);
            io.to(eventId).emit('receive comments', await getAllCommentsById(eventId));
        })
    });

}