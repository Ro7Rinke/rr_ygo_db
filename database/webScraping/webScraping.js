const fs = require('fs')
const axios = require('axios')
const gameInfo = require('../gameInfo.json')
const getCards = require('../addCards/getCards')

const domain = `https://yugioh.fandom.com`


let logs = []

const logToFile = () => {
    fs.writeFileSync('./logs.log', logs.join('\n'))
}

var getFromBetween = {
    results:[],
    string:"",
    getFromBetween:function (sub1,sub2) {
        if(this.string.indexOf(sub1) < 0 || this.string.indexOf(sub2) < 0) return false;
        var SP = this.string.indexOf(sub1)+sub1.length;
        var string1 = this.string.substr(0,SP);
        var string2 = this.string.substr(SP);
        var TP = string1.length + string2.indexOf(sub2);
        return this.string.substring(SP,TP);
    },
    removeFromBetween:function (sub1,sub2) {
        if(this.string.indexOf(sub1) < 0 || this.string.indexOf(sub2) < 0) return false;
        var removal = sub1+this.getFromBetween(sub1,sub2)+sub2;
        this.string = this.string.replace(removal,"");
    },
    getAllResults:function (sub1,sub2) {
        // first check to see if we do have both substrings
        if(this.string.indexOf(sub1) < 0 || this.string.indexOf(sub2) < 0) return;

        // find one result
        var result = this.getFromBetween(sub1,sub2);
        // push it to the results array
        this.results.push(result);
        // remove the most recently found one from the string
        this.removeFromBetween(sub1,sub2);

        // if there's more substrings
        if(this.string.indexOf(sub1) > -1 && this.string.indexOf(sub2) > -1) {
            this.getAllResults(sub1,sub2);
        }
        else return;
    },
    get:function (string,sub1,sub2) {
        this.results = [];
        this.string = string;
        this.getAllResults(sub1,sub2);
        return this.results;
    }
};

const getBoosterLinks = async (link) => {

    const response = await axios.get(link)

    const page = response.data

    const pageArray = page.split('\n')
    
    const linkLines = pageArray.filter(line => ((typeof line == 'string') && (line.includes('<ul><li><a href=') && line.includes('</li></ul>'))))
    return linkLines
}

const getPageLines = async (boosterLink) => {
    const response = await axios.get(boosterLink)

    const page = response.data

    return page.split('\n')
}

const getCardLines = async (pageLines) => {

    const indexLineUltraRare = pageLines.findIndex(line => line.includes(`class="mw-headline" id="Ultra_Rare"`))
    const indexLineEnd = pageLines.findIndex((line, index, array) => (line.includes(`<li><a href="/wiki/`) && line.includes(`</a></li></ul>` && (array[index+1].includes(`<tab`) || array[index+1].includes(`</t`)))))
    console.log(indexLineEnd)
    return pageLines.slice(indexLineUltraRare, indexLineEnd+1)
}

const generateCardsInfo = (cardLines) => {
    const indexUltraRareHeadLine = cardLines.findIndex(line => line.includes(`id="Ultra_Rare"`))
    const indexSuperRareHeadLine = cardLines.findIndex(line => line.includes(`id="Super_Rare"`))
    const indexRareHeadLine = cardLines.findIndex(line => line.includes(`id="Rare"`))
    const indexCommonHeadLine = cardLines.findIndex(line => line.includes(`id="Common"`))

    const lines = {
        ultraRares: cardLines.slice(indexUltraRareHeadLine+1, indexSuperRareHeadLine),
        superRares: cardLines.slice(indexSuperRareHeadLine+1, indexRareHeadLine),
        rares: cardLines.slice(indexRareHeadLine+1, indexCommonHeadLine),
        commons: cardLines.slice(indexCommonHeadLine+1),
    }

    const cardsInfo = {
        ultraRares: [],
        superRares: [],
        rares: [],
        commons: []
    }

    for(const key in lines){
        for(const line of lines[key]){
            cardsInfo[key].push(getFromBetween.get(line, `">`, `</a></li>`)[0])
        }
    }

    return cardsInfo
}

const web = async () => {

    let info = {
        boosters: []
    }

    for(const game of gameInfo.games){
        let packNumber = 1
        for(const booster of game.boosters){
            if(packNumber >=3)
                break
            console.log(booster.name)

            packNumber++

            const pageLines = await getPageLines(`${domain}${booster.link}`)
    
            const cardLines = await getCardLines(pageLines)
        
            const cardsInfo = generateCardsInfo(cardLines)

            const boosterInfo = {
                game: game.name,
                name: booster.name,
                price: booster.price,
                unlockInfo: booster.unlockInfo,
                packNumber,
                cardsPerPack: 0,
                coverCard: '',
                totalCards: cardLines.length,
                cards: cardsInfo
            }

            info.boosters.push(boosterInfo)
        }
    }

    fs.writeFileSync('../info.json', JSON.stringify(info))

}

// web()



const splitTexts = (text) => {
    const array = text.split('###############################################################################')

    return {
        textBooster: array[0],
        textCards: array[1]
    }
}

const getInfoFromBoosterLines = (boosterLines) => {
    let boosters = []
    let number = 1
    for(const line of boosterLines){
        if(line.trim()){
            const name = getFromBetween.get(line, '|', '|')[0]
            const unlockInfo = getFromBetween.get(line, '{', '}')[0]
            const boosterInfo = {
                packNumber: number,
                name,
                unlockInfo,
                cardsPerPack: 5,
                price: 0,
                totalCards: 0,
                game: 'Tag Force 1',
                cards: {
                    ultraRares: [],
                    superRares: [],
                    rares: [],
                    commons: []
                }
            }

            boosters.push(boosterInfo)

            number++
        }
    }

    return boosters
}

const getCardInfo = (textCards, info) => {
    const textCardsSplit = textCards.split('-------------------------------------------------------------------------------')

    const specialNumbers = [48,39,29,16]

    for(const indexBooster in info.boosters){
        if(!specialNumbers.includes(info.boosters[indexBooster].packNumber)){

            const indexCardText = textCardsSplit.findIndex(text => text.includes(info.boosters[indexBooster].name))
            
            const text = textCardsSplit[indexCardText]
            const cardLines = text.split('\n')
    
            const indexBoosterInfoLine = cardLines.findIndex(line => line.includes(info.boosters[indexBooster].name))

            info.boosters[indexBooster].price = parseInt(getFromBetween.get(cardLines[indexBoosterInfoLine], ')', ' DP')[0].trim().replaceAll('.', ''))
            
            const indexUltra = cardLines.findIndex(line => line == 'Ultra Rare')
            const indexSuper = cardLines.findIndex(line => line == 'Super Rare')
            const indexRare = cardLines.findIndex(line => line == 'Rare')
            const indexCommon = cardLines.findIndex(line => line == 'Common')

            if(info.boosters[indexBooster].packNumber != 40){
                info.boosters[indexBooster].cards.ultraRares = cardLines.slice(indexUltra+1, indexSuper).filter(line => line.trim() ? true : false)
                info.boosters[indexBooster].cards.superRares = cardLines.slice(indexSuper+1, indexRare).filter(line => line.trim() ? true : false)
                info.boosters[indexBooster].cards.rares = cardLines.slice(indexRare+1, indexCommon).filter(line => line.trim() ? true : false)    
            }
            info.boosters[indexBooster].cards.commons = cardLines.slice(indexCommon+1).filter(line => line.trim() ? true : false)
            
            info.boosters[indexBooster].totalCards = info.boosters[indexBooster].cards.ultraRares.length
                + info.boosters[indexBooster].cards.superRares.length
                + info.boosters[indexBooster].cards.rares.length
                + info.boosters[indexBooster].cards.commons.length
        }
    }
}

const getCardInfoSpecial = (info) => {
    //Emergent Fire, Water of Life, Gift of Wind, Platinum Light, Earth Dwellers, and Visitor from the Dark
    //pack 16 Lucky Economy Pack
    const indexLucky = info.boosters.findIndex(booster => booster.name == 'Lucky Economy Pack')
    const indexFire = info.boosters.findIndex(booster => booster.name == 'Emergent Fire')
    const indexWater = info.boosters.findIndex(booster => booster.name == 'Water of Life')
    const indexWind = info.boosters.findIndex(booster => booster.name == 'Gift of Wind')
    const indexLight = info.boosters.findIndex(booster => booster.name == 'Platinum Light')
    const indexEarth = info.boosters.findIndex(booster => booster.name == 'Earth Dwellers')
    const indexDark = info.boosters.findIndex(booster => booster.name == 'Visitor from the Dark')

    for(const key in info.boosters[indexLucky].cards){
        info.boosters[indexLucky].cards[key].push(
            ...info.boosters[indexFire].cards[key],
            ...info.boosters[indexWater].cards[key],
            ...info.boosters[indexWind].cards[key],
            ...info.boosters[indexLight].cards[key],
            ...info.boosters[indexEarth].cards[key],
            ...info.boosters[indexDark].cards[key],
        )
    }

    info.boosters[indexLucky].totalCards = info.boosters[indexLucky].cards.ultraRares.length
    + info.boosters[indexLucky].cards.superRares.length
    + info.boosters[indexLucky].cards.rares.length
    + info.boosters[indexLucky].cards.commons.length


    // pack 29 Symbol 50 (17-25)
    const indexSymbol = info.boosters.findIndex(booster => booster.name == 'Symbol 50')
    for(let packNumber = 17; packNumber <= 25; packNumber++){
        const index = info.boosters.findIndex(booster => booster.packNumber == packNumber)

        for(const key in info.boosters[indexSymbol].cards){
            info.boosters[indexSymbol].cards[key].push(
                ...info.boosters[index].cards[key],
            )
        }
    }

    info.boosters[indexSymbol].totalCards = info.boosters[indexSymbol].cards.ultraRares.length
    + info.boosters[indexSymbol].cards.superRares.length
    + info.boosters[indexSymbol].cards.rares.length
    + info.boosters[indexSymbol].cards.commons.length


    //Pack 39 Bit Players (all rares)
    const indexBit = info.boosters.findIndex(booster => booster.name == 'Bit Players')
    for(const booster of info.boosters){
        if(booster.name != 'Bit Players'){
            info.boosters[indexBit].cards.rares.push(
                ...booster.cards.rares,
            )
        }
    }

    info.boosters[indexBit].totalCards = info.boosters[indexBit].cards.ultraRares.length
    + info.boosters[indexBit].cards.superRares.length
    + info.boosters[indexBit].cards.rares.length
    + info.boosters[indexBit].cards.commons.length


    //pack 48 Checkered Flag (all cards)
    const indexFlag = info.boosters.findIndex(booster => booster.name == 'Checkered Flag')
    for(const booster of info.boosters){
        if(booster.name != 'Checkered Flag'){
            for(const key in booster.cards){
                info.boosters[indexFlag].cards[key].push(
                    ...booster.cards[key],
                )
            }
        }
    }

    info.boosters[indexFlag].totalCards = info.boosters[indexFlag].cards.ultraRares.length
    + info.boosters[indexFlag].cards.superRares.length
    + info.boosters[indexFlag].cards.rares.length
    + info.boosters[indexFlag].cards.commons.length
}

const generateInfo = async () => {
    let boosters = []
    
    for(const game of gameInfo.games){
        let packNumber = 1
        for(const boosterInfo of game.boosters){
            console.log(boosterInfo.name, ' - ', packNumber, ' - ', game.name)
            const cards = await getCards(`${domain}${boosterInfo.link}`)

            let booster = {
                name: boosterInfo.name,
                game: game.name,
                unlockInfo: boosterInfo.unlockInfo,
                price: boosterInfo.price,
                cardsPerPack: boosterInfo.cardsPerPack ? boosterInfo.cardsPerPack : 0,
                totalCards: cards.ultraRares.length + cards.superRares.length + cards.rares.length + cards.commons.length,
                packNumber,
                cards,
                link: boosterInfo.link
            }

            boosters.push(booster)
            packNumber++
        }

        //parse special boosters

        for(const boosterIndex in boosters){
            if(boosters[boosterIndex].name == 'Lucky Economy Pack'){

                const indexFire = boosters.findIndex(element => element.name = `Emergent Fire`)
                const indexWater = boosters.findIndex(element => element.name = `Water of Life`)
                const indexWind = boosters.findIndex(element => element.name = `Gift of Wind`)
                const indexLight = boosters.findIndex(element => element.name = `Platinum Light`)
                const indexEarth = boosters.findIndex(element => element.name = `Earth Dwellers`)
                const indexDark = boosters.findIndex(element => element.name = `Visitor from the Dark`)

                for(const rarity in boosters[boosterIndex].cards){
                    boosters[boosterIndex].cards[rarity].push(
                        ...boosters[indexFire].cards[rarity],
                        ...boosters[indexWater].cards[rarity],
                        ...boosters[indexWind].cards[rarity],
                        ...boosters[indexLight].cards[rarity],
                        ...boosters[indexEarth].cards[rarity],
                        ...boosters[indexDark].cards[rarity]
                    )
                }

                boosters[boosterIndex].totalCards = boosters[boosterIndex].cards.ultraRares.length + boosters[boosterIndex].cards.superRares.length + boosters[boosterIndex].cards.rares.length + boosters[boosterIndex].cards.commons.length
            }

            if(boosters[boosterIndex].name == 'Taste the Attributes'){

                const indexFire = boosters.findIndex(element => element.name = `Dueling with Fire`)
                const indexWater = boosters.findIndex(element => element.name = `Raging Waters`)
                const indexWind = boosters.findIndex(element => element.name = `A Gust of Wind`)
                const indexLight = boosters.findIndex(element => element.name = `Light from Above`)
                const indexEarth = boosters.findIndex(element => element.name = `Earthly Powers`)
                const indexDark = boosters.findIndex(element => element.name = `Creeping Darkness`)

                for(const rarity in boosters[boosterIndex].cards){
                    boosters[boosterIndex].cards[rarity].push(
                        ...boosters[indexFire].cards[rarity],
                        ...boosters[indexWater].cards[rarity],
                        ...boosters[indexWind].cards[rarity],
                        ...boosters[indexLight].cards[rarity],
                        ...boosters[indexEarth].cards[rarity],
                        ...boosters[indexDark].cards[rarity]
                    )
                }

                boosters[boosterIndex].totalCards = boosters[boosterIndex].cards.ultraRares.length + boosters[boosterIndex].cards.superRares.length + boosters[boosterIndex].cards.rares.length + boosters[boosterIndex].cards.commons.length
            }

            if(boosters[boosterIndex].name == 'Symbol 50'){

                const index5 = boosters.findIndex(element => element.name = `Endless Thoughts`)
                const index10 = boosters.findIndex(element => element.name = `Flip the Picture`)
                const index15 = boosters.findIndex(element => element.name = `Equip Me`)
                const index20 = boosters.findIndex(element => element.name = `More Eternal Memories`)
                const index25 = boosters.findIndex(element => element.name = `Speed King`)
                const index30 = boosters.findIndex(element => element.name = `Spice of Duel`)
                const index35 = boosters.findIndex(element => element.name = `Fairy's Sky`)
                const index40 = boosters.findIndex(element => element.name = `Dragon Drive`)
                const index45 = boosters.findIndex(element => element.name = `Fiend Night`)

                for(const rarity in boosters[boosterIndex].cards){
                    boosters[boosterIndex].cards[rarity].push(
                        ...boosters[index5].cards[rarity],
                        ...boosters[index10].cards[rarity],
                        ...boosters[index15].cards[rarity],
                        ...boosters[index20].cards[rarity],
                        ...boosters[index25].cards[rarity],
                        ...boosters[index30].cards[rarity],
                        ...boosters[index35].cards[rarity],
                        ...boosters[index40].cards[rarity],
                        ...boosters[index45].cards[rarity],
                    )
                }

                boosters[boosterIndex].totalCards = boosters[boosterIndex].cards.ultraRares.length + boosters[boosterIndex].cards.superRares.length + boosters[boosterIndex].cards.rares.length + boosters[boosterIndex].cards.commons.length
            }

            if(boosters[boosterIndex].name == 'Bit Players'){

                for(const booster of boosters){
                    if(booster.name != 'Bit Players' && booster.name != 'Checkered Flag' 
                        && booster.name != 'Symbol 50' && booster.name != 'Lucky Economy Pack'  && booster.name != 'Taste the Attributes')
                        
                        boosters[boosterIndex].cards.rares.push(
                            ...booster.cards.rares
                        )
                }

                boosters[boosterIndex].totalCards = boosters[boosterIndex].cards.ultraRares.length + boosters[boosterIndex].cards.superRares.length + boosters[boosterIndex].cards.rares.length + boosters[boosterIndex].cards.commons.length
            }

            if(boosters[boosterIndex].name == 'Checkered Flag'){

                for(const booster of boosters){
                    if(booster.name != 'Checkered Flag' && booster.name != 'Bit Players' 
                        && booster.name != 'Symbol 50' && booster.name != 'Lucky Economy Pack'  && booster.name != 'Taste the Attributes')
                        
                        for(const rarity in boosters[boosterIndex].cards){
                            boosters[boosterIndex].cards[rarity].push(
                                ...booster.cards[rarity]
                            )
                        }
                }

                boosters[boosterIndex].totalCards = boosters[boosterIndex].cards.ultraRares.length + boosters[boosterIndex].cards.superRares.length + boosters[boosterIndex].cards.rares.length + boosters[boosterIndex].cards.commons.length
            }

            
            if(boosters[boosterIndex].totalCards == 0){
                logs.push(`${boosters[boosterIndex].name} - ${boosters[boosterIndex].link}`)
            }
        }
    }

    return boosters
}

const main = async () => {

    // const text = fs.readFileSync('../TagForce1.txt', {encoding: 'utf-8'}).replaceAll('\r', '')

    // const {textBooster, textCards} = splitTexts(text)

    // const boosterLines = textBooster.split('\n')

    // let info = {
    //     boosters: getInfoFromBoosterLines(boosterLines)
    // }

    // getCardInfo(textCards, info)

    // getCardInfoSpecial(info)

    // fs.writeFileSync('../Info.json', JSON.stringify(info))

    let info = {
        boosters: await generateInfo()
    }

    fs.writeFileSync('../info.json', JSON.stringify(info))
    
    logToFile()
}

main()




