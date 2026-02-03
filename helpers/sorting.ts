const trendingSorting = (data: any) => {
    let events = data.sort((x: any, b: any) => { return x.answerAmount - b.answerAmount })
    return events.reverse();
}

const controversialSorting = (data: any) => {
    for (let i = 0; i < data.length; i++) {
        let allQuantity = data[i].parcipiantAnswers == undefined ? 0 : data[i].parcipiantAnswers.length;
        // calcalate fomula
        data[i].controversial = (100 - allQuantity) / 100;
    }
    let events = data.sort((x: any) => { return x.controversial })
    return events;
}

export {
    trendingSorting,
    controversialSorting
}
