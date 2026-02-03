import { 
    chooseBots,
    checkEventTime,
    countTrueAnswers,
    generateFalseAnswerNumber,
    shuffle
} from '../valid_bot';

describe('Test validate_event endpoint', () => {
    jest.setTimeout(300000);
    
    const nowTime = Math.floor(Date.now() / 1000);
    const checkEventTimeData = [
        {
            input: nowTime + 1000, output: {
                status: 400,
                response: { status: 'Event time is not over' }
            }
        },
        { input: nowTime - 1000, output: undefined},
        { input: nowTime, output: undefined }
    ]
    test('test checkEventTime func', () => {
        checkEventTimeData.forEach((testObject) => {
            const checkEventTimeRes = checkEventTime(testObject.input)
            expect(checkEventTimeRes).toStrictEqual(testObject.output)
        })
    })


    const countTrueAnswersData = [
        { input: 10, output: 6 },
        { input: 1, output: 1 },
        { input: 47, output: 28 },
        { input: 37492, output: 22495 },
        {
            input: 0, output: {
                status: 400,
                response: { status: 'Number of valids < 1' }
            } },
        {
            input: -26, output: {
                status: 400,
                response: { status: 'Number of valids < 1' }
            } 
        }
    ]
    test('test countTrueAnswers func', () => {
        countTrueAnswersData.forEach((testObject) => {
            const countTrueAnswersRes = countTrueAnswers(testObject.input)
            expect(countTrueAnswersRes).toStrictEqual(testObject.output)
        })
    })

    const bots = [
        {
            "_id": 351843720888553,
            "expertReputPoins": 5
        },
        {
            "_id": 351843720888458
        },
        {
            "_id": 351843720888492,
            "expertReputPoins": -1
        },
        {
            "_id": 351843720888420
        },
        {
            "_id": 351843720888411,
            "expertReputPoins": 1
        },
        {
            "_id": 351843720888431
        }
    ]
    const chooseBotsData = [
        {
            input:{
                numberOfValids: 5, 
                answers: [], 
                checkEventValid: false
            }
        },
        {
            input: {
                numberOfValids: 4,
                answers: [{
                    from: {
                        "_id": 351843720888431
                    }
                }],
                checkEventValid: true
            },
            output: [{
                status: 400,
                response: 'Event was validated'
            }]
        }
    ]
    test('test chooseBots func', () => {
        const chooseBotsRes1 = chooseBots(bots, chooseBotsData[0].input.numberOfValids, chooseBotsData[0].input.answers, chooseBotsData[0].input.checkEventValid)
        const chooseBotsRes2 = chooseBots(bots, chooseBotsData[1].input.numberOfValids, chooseBotsData[1].input.answers, chooseBotsData[1].input.checkEventValid)
    
        expect(chooseBotsRes1).toHaveLength(chooseBotsData[0].input.numberOfValids)
        expect(chooseBotsRes2).toStrictEqual(chooseBotsData[1].output)
    })


    test('test shuffle func', () => {
        const shuffleRes = shuffle(bots)
        expect(shuffleRes).toHaveLength(bots.length)
        expect(shuffleRes).toEqual(expect.arrayContaining(bots))
    })


    test('test generateFalseAnswerNumber func', () => {
        for (let i = 1; i < 10; i += 2) {
            const generateFalseAnswerNumberRes = generateFalseAnswerNumber(i)

            expect(generateFalseAnswerNumberRes >= 0).toBe(true)
            expect(generateFalseAnswerNumberRes < i).toBe(true)
        }
    })
});