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
const site = 'events indianapolis'
const url = `https://www.google.com/search?q=${site.replace(' ','+')}&oq=events`

//CALL FUNCTION ASYNC AND GET DATA OF WEBSITE WITH FETCH AND CHEERIO
async function getDataEvents(URL){
    let data = ''
    const response = await fetch(URL)
    data = response.text()
    return data
}

const getAirbnbArrayData = getDataEvents(url).then( content =>{
    let title, site, href
    const $ = load(content)
    $('.am3QBf').each((index, el) =>{
        title = $(el).find('.deIvCb').text(),
        site = $(el).find('.tAd8D').text(),
        href = `https://www.google.com/search?q=${$(el).find('.deIvCb').text().replaceAll(' ', '+')},${$(el).find('.tAd8D').text().replaceAll(' ', '+')}`
        
        //PREPARE NEW OBJECT
        let sendData = { 
            title: title,
            extract: site,
            category: 'event',
            url: href
        }
        //CREATE FORMDATA
        let formData = new FormData()
        formData.set('data', JSON.stringify(sendData))
        const encoder = new FormDataEncoder(formData)
        //SEND FORMDATA TO STRAPI
        fetch('http://localhost:1337/api/events', {
            method: "post",
            headers: encoder.headers,
            body: Readable.from(encoder)
        })
        .then(response => {
            if(response.status === 200){
                console.log('Event '+$(el).find('.deIvCb').text()+' Submit')
            }else{
                console.log('Error')
            }
        })
        .catch(error =>{
            console.log(error)
        })
        
    })
})