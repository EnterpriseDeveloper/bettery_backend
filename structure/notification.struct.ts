const notificationStruct = (data: any) => {
    return data.filter((x: any) => {
        if (x['notificationFromRoom/publicEventsId'] == undefined) {
            return false;
        }
        return true;
    }).map((x: any) => {
        return {
            id: x["_id"],
            read: x['notificationFromRoom/read'],
            roomId: x['notificationFromRoom/publicEventsId']['publicEvents/room'][0]["_id"],
            userName: x['notificationFromRoom/publicEventsId']['publicEvents/host']["users/nickName"],
            userAvatar: x['notificationFromRoom/publicEventsId']['publicEvents/host']["users/avatar"],
            eventEnd: x['notificationFromRoom/publicEventsId']['publicEvents/endTime'],
            eventId: x['notificationFromRoom/publicEventsId']["_id"],
            date: x['notificationFromRoom/date']
        }
    })
}

export {
    notificationStruct
}