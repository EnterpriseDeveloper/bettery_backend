const expReputationCalc = (allValidators: any, correctAnswer: any) => {
    let forSendReputation = []
    for (let i = 0; i < allValidators.length; i++) {
        let rep = allValidators[i]['publicActivites/from']['users/expertReputPoins'] == undefined ? 0 : allValidators[i]['publicActivites/from']['users/expertReputPoins']

        if (correctAnswer === allValidators[i]["publicActivites/answer"]) {
            let x = {
                "_id": Number(allValidators[i]['publicActivites/from']._id),
                "expertReputPoins": Number(rep + 1),
            }
            forSendReputation.push(x)
        } else {
            let x = {
                "_id": Number(allValidators[i]['publicActivites/from']._id),
                "expertReputPoins": Number(rep - 2),
            }
            forSendReputation.push(x)
        }
    }
    return {
        forSendReputation,
    }
}

export {
    expReputationCalc
}
