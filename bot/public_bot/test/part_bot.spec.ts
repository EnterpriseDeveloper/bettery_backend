import {
    checkEndTime,
    letsChooseRandomBots,
    letsChooseRandomBet
} from '../part_bot';

describe('Test part_bot endpoint', () => {
    jest.setTimeout(300000);
    
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
    test('test letsChooseRandomBots func', () => {
        for (let i = 1; i <= bots.length; i++) {

            const letsChooseRandomBotsRes = letsChooseRandomBots(i, bots)
            expect(letsChooseRandomBotsRes).toHaveLength(i)
        }
    })

    
    const nowTime = Math.floor(Date.now() / 1000);
    const checkEndTimeData = [
        { input: nowTime + 1800000, output: true },
        { input: nowTime + 2000000, output: true },
        { input: nowTime, output: false }
    ]
    test('test checkEndTime func', () => {
        checkEndTimeData.forEach((testObject) => {
            const checkEndTimeRes = checkEndTime(testObject.input)
            expect(checkEndTimeRes).toStrictEqual(testObject.output)
        })
    })


    test('test letsChooseRandomBet func', () => {
        for (let i = 0.2; i < 2; i+= 0.2) {
            const letsChooseRandomBetRes = letsChooseRandomBet(0.1, i)

            expect(letsChooseRandomBetRes > 0).toBe(true)
            expect(letsChooseRandomBetRes <= i).toBe(true)
        }
    })
});