const fs = require('fs')
const sqlite3 = require('sqlite3').verbose()
const short = require('short-uuid');
const boosterInfo = require('../info.json')
const { Client } = require('pg')
const { getCardNameFromWiki } = require('./getCards')
// const { parseLinkName } = require('../webScraping/getImageFromWiki')

const domain = `https://yugioh.fandom.com`

const pgConfig = {
    user: 'postgres',
    password: '2772',
    host: 'localhost',
    database: 'rr_ygo_db_dev',
    port: 5432
}

let logs = []

const logToFile = () => {
    fs.writeFileSync('./logs.log', logs.join('\n'))
}

const toArray = (object = {}) => {
    let array = []
    
    for(const key in object){
        if(object.hasOwnProperty(key))
            array.push(object[key])
    }
    
    return array
}

const openDatabase = (path) => {
    return new sqlite3.Database(path, (error) => {
        if (error) {
           console.log(error)
        }
    })
}

const insertBooster = async (booster) => {
    const client = new Client(pgConfig)
    await client.connect()

    let sql = `INSERT INTO booster VALUES($1, $2, $3, $4, $5, $6, $7, $8)`
    let params = [
        booster.id,
        booster.name,
        booster.gameId,
        booster.coverCardId,
        booster.price,
        booster.cardsPerPack,
        booster.packNumber,
        booster.unlockInfo
    ]

    const {rows} = await client.query(sql, params)

    client.end()

    if(!rows){
        console.log(`Error inserting booster\n${booster}`)
    }
}

const insertBoosterCard = async (boosterCard) => {
    const client = new Client(pgConfig)
    await client.connect()

    let sql = `INSERT INTO booster_card VALUES($1, $2, $3, $4)`
    let params = [
        boosterCard.id,
        boosterCard.cardId,
        boosterCard.boosterId,
        boosterCard.rarityId
    ]

    const {rows} = await client.query(sql, params)

    client.end()

    if(!rows){
        console.log(`Error inserting boosterCard\n${boosterCard}`)
    }
}

const insertCard = async (card) => {
    const client = new Client(pgConfig)
    await client.connect()

    let sql = `INSERT INTO card VALUES($1, $2, $3, $4, $5)`
    let params = [
        card.id,
        card.ygoId,
        card.name,
        card.alias,
        card.picUrl
    ]

    const {rows} = await client.query(sql, params)

    client.end()

    if(!rows){
        console.log(`Error into card\n${card}`)
    }
}

const getCardIdRRYGODB = async (cardName) => {
    const client = new Client(pgConfig)
    await client.connect()

    let sql = `SELECT id FROM card WHERE name like $1 or alias like $1`
    let params = [cardName]

    const {rows} = await client.query(sql, params)

    client.end()

    if(Array.isArray(rows) && rows.length > 0){
        return rows[0].id
    }else{
        return null
    }
}

const parseCardNameSpecial = (cardName) => {
    switch(cardName){
        case 'De-Spell Germ Weapon':
            return 'Virus Cannon'
        case 'Defender of the Sea':
            return 'Sentinel of the Seas'
        case 'Swordsman from a Foreign Land':
            return 'Swordsman from a Distant Land'
        case `Dark Magician's Tome of Black Magic`:
            return `Magic Formula`
        case `Earthbound Spirit's Invitation`:
            return `Call of the Earthbound`
        case `Hidden Book of Spell`:
            return `Hidden Spellbook`
        case `Clone Duplication`:
            return `Cloning`
        case `Monster Relief`:
            return `Relieve Monster`
        case `Enchanted Arrow`:
            return `Spell Shattering Arrow`
        case `Gemini Fiend`:
            return `Gemini Imps`
        case `Calamity of the Wicked`:
            return `Malevolent Catastrophe`
        case `Skull Descovery Knight`:
            return `Doomcaliber Knight`
        case `Rope of Spirit`:
            return `Soul Rope`
        case `Rancer Dragonute`:
            return `Lancer Dragonute`
        case `Red-Eyes B. Dragon`:
            return `Red-Eyes Black Dragon`
        default:
            return cardName
    }
}

const getCardYGO = async (cardName) => {
    return new Promise((resolve, reject) => {
        try{
            cardName = parseCardNameSpecial(cardName)

            let db = openDatabase('../ygoCDBs/cards.cdb')
    
            let sql = `SELECT d.*, t.* from datas d inner join texts t on d.id = t.id where t.name like (?)`
            let params = [cardName]
            db.get(sql, params, async (error, row) => {
                if(error){
                    console.log(error)
                    reject(error)
                }else if(row){
                    resolve(row)
                }else{
                    const wikiName = await getCardNameFromWiki(`${domain}/wiki/${cardName}`)
                    console.log(cardName, ' - ', wikiName)
                    db.get(sql, [wikiName], (error, row) => {
                        if(error){
                            console.log(error)
                            reject(error)
                        }else if(row){
                            resolve(row)
                        }else{
                            logs.push(`${cardName} - Não achou.`)
                            reject(`can't find card: ${cardName}`)      
                        }
                    })
                }
            })
        }catch(error){
            console.log(error)
        }
    })
}

const getCardId = async (cardName) => {
    let cardId = await getCardIdRRYGODB(cardName)
    if(!cardId){
        try {
            const cardYgo = await getCardYGO(cardName)
            if(cardYgo){
                cardId = short.generate()
                await insertCard({
                    id: cardId,
                    ygoId: cardYgo.id,
                    name: cardYgo.name,
                    alias: cardName,
                    picUrl: ''
                    //text: cardYgo.text
                })
            }
            // else{
            //     console.log("can't find card - ", cardName)
            // }

        } catch (error) {
            console.log(error)
        }
    }
    return cardId
}

const getRarityId = (rarity) => {
    switch(rarity){
        case 'commons':
            return 'bMmradd6rRyP3j4MRqvc69'
        case 'rares':
            return 'fQjrFpuv7rniPxzueLDXBh'
        case 'superRares':
            return 'dSha8VQUz5BzaybQLD5zws'
        case 'ultraRares':
            return '6uvQQhC615BSYWPpM2Tz14'
        default:
            console.log("can't find rarity")
            return '4Pxb4aj6BQu5dgsQQXeRCe'
    }
}

const getGameId = (gameName) => {
    switch(gameName){
        case 'Tag Force 1':
            return '2Ycwxe5HmkRXqimFKkWzam'
        case 'Tag Force 2':
            return 'kMhLWG4TpMvpyN71vNiwk9'
        case 'Tag Force 3':
            return '5zAS6r1fo5dAswJ8BbiWsv'
        case 'Tag Force 4':
            return '35MF5jDZqEq1hH1QrvfgTQ'
        case 'Tag Force 5':
            return 'ebGS3HQuw3Tw3PRGDoNTcR'
        case 'Tag Force 6':
            return 'ha7w7T2i685CWGzDxw2Rhq'
        case 'Tag Force Special':
            return '1DP6iRScu5mRwh1QJGF3kK'
        case 'Tag Force Evoluiton':
            return 'suoMZMQUg6AqrKJmSHjfqx'
        default:
            return '6UBoEL9jPt93XXQcsqWcwP'
    }
}

const insertBoostersInfo = async () => {

    for(const booster of boosterInfo.boosters){
        console.log('Booster: ',booster.name)
        const boosterId = short.generate()

        await insertBooster({
            id: boosterId,
            name: booster.name,
            gameId: getGameId(booster.name),
            coverCardId: null,
            price: booster.price,
            cardsPerPack: booster.cardsPerPack,
            packNumber: booster.packNumber,
            unlockInfo: booster.unlockInfo
        })

        for(const key in booster.cards){
            for(const cardName of booster.cards[key]){
                const boosterCard = {
                    id: short.generate(),
                    cardId: await getCardId(cardName),
                    boosterId,
                    rarityId: getRarityId(key)
                }

                await insertBoosterCard(boosterCard)
            }
        }
    }
}

const addCard = async () => {
    // for(const booster of boosterInfo.boosters){
    //     for(const key in booster.cards){
    //         for(const cardName of booster.cards[key]){
    //             try{
    //                 await getCardYGO(cardName)
    //             }catch(error){
    //                 // console.log(error)
    //             }
    //         }
    //     }
    // }

    await insertBoostersInfo()
    
    console.log(logs.length)
    logToFile()
}

addCard()

module.exports = {
    getCardYGO,
    addCard,
}