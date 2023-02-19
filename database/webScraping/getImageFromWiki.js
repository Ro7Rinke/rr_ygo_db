const { Client } = require('pg')
const axios = require('axios')

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

const pgConfig = {
    user: 'postgres',
    password: '2772',
    host: 'localhost',
    database: 'rr_ygo_db_dev',
    port: 5432
}

const parseLinkName = (name) => {
    return name.replaceAll(` `, `_`)
        .replaceAll(`#`, ``)
        .replaceAll(`%`, `%25`)
        .replaceAll(`'`, `%27`)
        .replaceAll(`?`,`%3F`)
}

const getCards = async () => {
    const client = new Client(pgConfig)
    await client.connect()

    let sql = `SELECT id, name, alias FROM card`
    let params = []

    const { rows } = await client.query(sql, params)

    client.end()

    if(Array.isArray(rows) && rows.length > 0){
        return rows
    }else{
        return null
    }
}

const updatePicUrl = async (card) => {
    const client = new Client(pgConfig)
    await client.connect()


    let sql = `UPDATE CARD SET pic_url = $1 WHERE id = $2`
    let params = [card.picUrl, card.id]

    const {rows} = await client.query(sql, params)
    
    client.end()

    if((Array.isArray(rows) && rows.length > 0)){
        return true
    }else{
        return false
    }
}

const getImageLink = async (cardName) => {
    const parsedCardName = parseLinkName(cardName)

    const response = await axios.get(`https://yugioh.fandom.com/wiki/${parsedCardName}`)
    const page = response.data
    const pageLines = page.split('\n')

    const indexImageLine = pageLines.findIndex(line => line.includes(`class="cardtable-cardimage"`))

    if(indexImageLine >= 0 && pageLines[indexImageLine])
        return getFromBetween.get(pageLines[indexImageLine], `<a href="`, `" class="image"`)[0]
    else
        return null
}



const main = async () => {
    const cards = await getCards()

    for(const card of cards){
        // if(card.name == 'Level Down!?'){

            let imageLink = await getImageLink(card.name)

            if(!imageLink)
                imageLink = await getImageLink(card.alias)

            if(!imageLink)
                imageLink = await getImageLink(`${card.name} (card)`)

            if(!imageLink)
                imageLink = await getImageLink(`${card.alias} (card)`)

            if(!imageLink)
                console.log(`Can't get link\nName: ${card.name}\nAlias: ${card.alias}\n`)

            updatePicUrl({...card, picUrl: imageLink})
        // }
    }
}

main()

module.exports = {parseLinkName}