import fetch from "node-fetch";
import { load } from "cheerio";
import fs from "fs"
import { FormData } from "formdata-node";
import {FormDataEncoder} from "form-data-encoder"
import {Readable} from "stream"
import path from "path";
/*

AIRBNB DATA

*/

//DIFENE GEOLOCATION AND FINE URI OF AIRBNB
const geoLocation = 'Indianapolis'
const urlAirbnb = `https://www.airbnb.com/s/${geoLocation}/homes?&pagination_search=true&items_offset=`

//CALL FUNCTION ASYNC AND GET DATA OF WEBSITE WITH FETCH AND CHEERIO
async function getDataUrlAirbnb(URL, page){
    let data = ''
    const indexPage = page * 10;
    const response = await fetch(URL+indexPage)
    data = response.text()
    return data
}

const getAirbnbArrayData = getDataUrlAirbnb(urlAirbnb, 2).then( content =>{
    const $ = load(content)
    /*
    GET JSON FILE OF AIRBNB
    id="data-deferred-state" data-deferred-state="true"
    */
    let jsonData = $('#data-deferred-state').html()
    let convertJSON = JSON.parse(jsonData)
    let getSectionLengthAirbnb = convertJSON.niobeMinimalClientData[0][1].data.presentation.explore.sections.sections.length
    let exploreGetData = ''
    let validateGetSearchData = false
    for (let index = 0; index < getSectionLengthAirbnb; index++) {
        try {
            exploreGetData = convertJSON.niobeMinimalClientData[0][1].data.presentation.explore.sections.sections[index].section.child.section.items
            validateGetSearchData = true
        }catch (error) {}
    }
    if(validateGetSearchData == true){
        let airbnbDataHotels = []
        for (const searchAirbnb of exploreGetData) {
            let tmpAirbnbDataPicture = []
            let tmpAirbnbDataCaption = []

            /*
            Title
            searchAirbnb.listing.name

            Get id for generate href
            searchAirbnb.listing.id

            Id and images 
            searchAirbnb.listing.contextualPictures

            Latitude and Longitude
            searchAirbnb.listing.lat
            searchAirbnb.listing.lng

            Person Capacity
            searchAirbnb.listing.pdpUrlType
            searchAirbnb.listing.personCapacity

            Utilities or addons 
            searchAirbnb.listing.previewAmenityNames

            Mount and currency
            searchAirbnb.pricingQuote.rate.amountFormatted
            searchAirbnb.pricingQuote.rate.currency

            Type price
            searchAirbnb.pricingQuote.rateType

            Rating
            searchAirbnb.listing.avgRating

            */

            for (const getCaption of searchAirbnb.listing.contextualPictures) {
               //GET PICTURE
               tmpAirbnbDataPicture.push(getCaption.picture)
                if(getCaption.caption != null){
                    //CAPTION MESSAGE
                    tmpAirbnbDataCaption.push(getCaption.caption.messages)
                }
            }
            airbnbDataHotels.push({
                title: searchAirbnb.listing.name,
                href: `https://www.airbnb.com/rooms/${searchAirbnb.listing.id}`,
                picture: tmpAirbnbDataPicture,
                lat_long: ""+searchAirbnb.listing.lat+", "+searchAirbnb.listing.lng+"",
                rooms: searchAirbnb.listing.pdpUrlType + ' '+ searchAirbnb.listing.personCapacity,
                addons: searchAirbnb.listing.previewAmenityNames,
                mount: searchAirbnb.pricingQuote.rate.amountFormatted + ' ' + searchAirbnb.pricingQuote.rate.currency,
                caption: tmpAirbnbDataCaption,
                rating: ""+searchAirbnb.listing.avgRating+""
            })

        }
        return airbnbDataHotels
    }else{
        return 'NO HAVING DATA'
    }
})

getAirbnbArrayData.then(data =>{
    //GET DATE
    let date = new Date()
    let getDay = date.getDay()
    let getMount = date.getMonth()
    let getYear = date.getFullYear()
    let getHours = date.getHours()
    let getMinutes = date.getMinutes()
    //GET ROOT FILE
    let getRootFile = process.cwd()
    //CREATE JSON FILE
    if(!fs.existsSync(path.join(getRootFile,'tmp'))){
        fs.mkdirSync(path.join(getRootFile,'tmp'),{recursive: true })
    }
    fs.writeFileSync(path.join(getRootFile,'tmp') + "/airbnb_"+getDay+"_"+getMount+"_"+getYear+"_"+getHours+"_"+getMinutes+".json",JSON.stringify(data),{encoding: "utf8",flag: "w",mode: 0o666});
    
})
