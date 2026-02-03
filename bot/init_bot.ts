import {DirectSecp256k1HdWallet} from "@cosmjs/proto-signing";
import axios from "axios";
import {path} from "../config/path";
import {mintTokens} from "../services/funds/betteryToken";
const bip39 = require("bip39");


const init_bot = async (req: any, res: any) => {
    let amount = req.body.amount
    if (amount && amount > 0 && amount < 50) {
        let params = await creatAllBots(amount)

        if (params && params.length) {
            // console.log(params, 'params')
            let response = await axios.post(`${path}/transact`, params).catch((err) => {
                console.log(err.response.statusText)
                res.status(400)
                res.send({error: `From DB: ${err.response.statusText}`})
                return
            })
            if (response) {
                await mintTokensAllBots(params)
                console.log('bots created successfully')
                res.status(200)
                res.send({message: 'OK'})
            }
        }
    } else {
        res.status(400)
        res.send({message: 'bad request, amount > 0 && amount < 50'})


    }
}

const creatAllBots = async (amount: number) => {
    let params = []
    for (let i = 0; i < amount; i++) {
        params.push(await creatOneBot(i))
    }
    return params
}

let creatOneBot = (i: any) => {
    return generationWallet().then(({wallet, mnemonic}) => {
        const nickName = randomName();
        return {
            "_id": "users",
            "avatar": `https://apitest.bettery.io/image/user_${i}.png`, // todo correct url
            "nickName": nickName,
            "email": `${nickName.replace(' ', '') + i}@gmail.com`,
            "wallet": wallet,
            "isBot": true,
            "seedPhrase": mnemonic
        }
    })
}

const mintTokensAllBots = async (params: any) => {
    if (params && params.length) {
        for (let i = 0; i < params.length; i++) {
            // console.log(params[i].wallet)
            await mintTokens(params[i].wallet, 100, params[i]._id, "bot init")
        }
    }
}


const randomName = () => {
    let name = ['Monica','Lisa ','Kevin', 'Ben','Walkery', 'Adamm', 'Bob', 'Bobi','Andrew','Fred','Martin','Gordon','Bill', 'Brad','Dave','Steve','Edgar','Barbie','Annie','Sasha',"Jenny",'Rosy','Rose','Jessie','James','King', 'Mary', 'Robert', 'Kirk', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Jessica', 'Sarah', 'Karen', 'Ryan', 'Justin', 'Gregory', 'Christine', 'Frank', 'Debra', 'Alexander', 'Raymond', 'Rachel', 'Catherine', 'Samuel', 'Benjamin', 'Jack', 'Dennis', 'Tom', 'Max', 'Johnny', 'Ruth', 'Jerry', 'Maria', 'Tyler', 'Heather', 'Aaron', 'Diane', 'Jose', 'Virginia', 'Adam', 'Julie', 'Henry', 'Joyce', 'Nathan', 'Victoria', 'Douglas', 'Olivia', 'Zachary', 'Kelly', 'Peter', 'Andrii', 'Christina', 'Kyle', 'Lauren', 'Walter', 'Joan', 'Ethan', 'Evelyn', 'Jeremy', 'Judith', 'Harold', 'Megan', 'Keith', 'Cheryl', 'Jerome', 'Johnson', 'Jones', 'Howard', 'Gilmore', 'Ford']
    let surname = ['Freddy','Lewis','Kudrow','Schwimmer','Young','Moore','Brown','Davis', 'Jackie', 'Nicky', 'Bertie', 'Danny', 'Walker','Harris', 'Adamson', 'Aldridge', 'Evans' ,'Davies', 'Wilson'  ,'Ellington' ,'Flatcher' ,'Gilbert', 'Smith','Choe', 'Choi', 'Chong', 'Bartlet','Cox','Perry', 'Sohrin', 'Chou', 'Chu', 'Chun', 'Chung', 'Chweh', 'Gil', 'Gu', 'Gwang', 'Hyun', 'Jang', 'Jeon', 'Haig', 'Hailey', 'Hamphrey', 'Hancock', 'Hardman', 'Harrison', 'Hawkins', 'Keat', 'Kelly', 'Kendal', 'Kennedy', 'MacAlister', 'MacDonald', 'Macduff', 'Macey', 'Mackenzie', 'Mansfield', 'Marlow', 'Marshman', 'Mason', 'Nash', 'Nathan', 'Neal', 'Nelson', 'Page', 'Palmer', 'Parkinson', 'Parson', 'Pass', 'Paterson', 'Salisburry', 'Salomon', 'Samuels', 'Saunder', 'Shackley', 'Sheldon', 'Sherlock', 'Shorter', 'Taft', 'Taylor', 'Thomson', 'Thorndike', 'Roberts', 'Roger', 'Russel', 'Ryder', 'Nevill', 'Nicholson', 'Nyman', 'Mathews', 'Mercer', 'Michaelson', 'Miers', 'Miller', 'Miln', 'Milton', 'Molligan', 'Morrison', 'Murphy']

    function getRandomInt(min: any, max: any) {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    return name[getRandomInt(0, name.length)] + ' ' + surname[getRandomInt(0, surname.length)];
}

const generationWallet = async () => {
    const mnemonic = bip39.generateMnemonic(256);
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic);
    const [pubKey] = await wallet.getAccounts();

    return {wallet: pubKey.address, mnemonic}
}

const info_bot = async (req: any, res: any) => {
    let params = {
        "select": ["_id"],
        "where": "users/isBot = true"
    }

    let data = await axios.post(`${path}/query`, params).catch((err: any) => {
        res.status(400)
        res.send(`Error from DB: ${err.response.statusText}`)
        return
    })

    if(data){
        let allBots = data.data
        res.status(200)
        res.send({
            botsAmount: allBots.length
        })
    }
}

export {
    init_bot,
    info_bot
}

