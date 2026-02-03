const searchData = (data: any, searchString: any) => {
    return data.filter((o: any) => {
        return o.question.toLowerCase().includes(searchString.toLowerCase()) || findInAnswers(o.answers, searchString);
    });
}

const findInAnswers = (data: any, searchString: any) => {
    let i = 0
    let includesData = false;
    do {
        includesData = data[i].toLowerCase().includes(searchString.toLowerCase());
        i++;
    } while (!includesData && i != data.length);
    return includesData;
}

export {
    searchData
}