const userStructure = (data: any) => {
    return data.map((x: any) => {
        return {
            _id: x["_id"],
            wallet: x["users/wallet"],
            nickName: x["users/nickName"],
            avatar: x["users/avatar"],
            email: x["users/email"],
            verifier: x["users/verifier"],
            linkedAccounts: x["users/linkedAccounts"] === undefined ? [] : x["users/linkedAccounts"]
        }
    })
}

export {
    userStructure
}