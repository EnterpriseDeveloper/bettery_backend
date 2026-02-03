const roomStruct = (data: any) => {
    return data.map((z: any) => {
        return {
            id: z["_id"],
            user: {
                id: z['room/owner']._id,
                nickName: z['room/owner']['users/nickName'],
                avatar: z['room/owner']['users/avatar']
            },
            name: z['room/name'],
            color: z['room/color'],
            joinedUsers: z['room/joinedUsers'] == undefined ? 0 : z['room/joinedUsers'].length,
            privateEventsId: z['room/privateEventsId'] == undefined ? [] : z['room/privateEventsId'],
            publicEventsId: z['room/publicEventsId'] == undefined ? [] : z['room/publicEventsId']
        }
    })
}

export {
    roomStruct
}
