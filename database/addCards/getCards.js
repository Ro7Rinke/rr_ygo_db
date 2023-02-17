const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const axios = require('axios')

const getPage = async (boosterLink) => {
    const response = await axios.get(boosterLink)
    return response.data
}

const getCardNameFromWiki = async (cardLink) => {
    
    const page = await getPage(cardLink)
    const dom = new JSDOM(page);

    const $ = require('jquery')(dom.window)

    let name = ''

    $('.cardtablerow').each((index, element) => {
        const language = $(element).children('.cardtablerowheader').text()
        if(language == 'English'){
            name = $(element).children('.cardtablerowdata').text()
        }
    })

    return name.replaceAll('\n', '')
}

const getCards = async (boosterLink) => {

    const page = await getPage(boosterLink)
    const dom = new JSDOM(page);

    const $ = require('jquery')(dom.window)

    let cards = {
        ultraRares: [],
        superRares: [],
        rares: [],
        commons: []
    }

    let selectedKey = ''

    let table = $('td').filter("[valign='top']")

    if($(table).length == 0){
        table = $('.mw-parser-output')
    }

    $(table).children('h4, h2, ul').each((index, element) => {
        if($(element).is('h2, h4')){
            switch($(element).children('span').attr('id')){
                case 'Ultra_Rare':
                    selectedKey = 'ultraRares'
                    break
                case 'Super_Rare':
                    selectedKey = 'superRares'
                    break
                case 'Rare':
                    selectedKey = 'rares'
                    break
                case 'Common':
                    selectedKey = 'commons'
                    break
                case 'Cards':
                    selectedKey = 'commons'
                    break
            }
        }else if($(element).is('ul')){
            $(element).children().each((indexCard, cardLi) => {
                if(!Array.isArray(cards[selectedKey]) && selectedKey)
                    cards[selectedKey] = []
                if(selectedKey){
                    let name = $(cardLi).children('a').attr('title')

                    if(!name)
                        name = $(cardLi).children('span').text()

                    cards[selectedKey].push(name)
                }
            })
        }    
    })

    return cards
}

const main = async () => {
    const cardName = await getCardNameFromWiki(`https://yugioh.fandom.com/wiki/M-Warrior_1`)
    console.log(cardName)
}
// main()

module.exports = {getCards, getCardNameFromWiki}