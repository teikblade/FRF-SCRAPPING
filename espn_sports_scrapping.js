import fetch from "node-fetch";
import cheerio from "cheerio";
import fs from "fs"
import { FormData } from "formdata-node";
import {FormDataEncoder} from "form-data-encoder"
import {Readable} from "stream"
import path from "path";

/*

ESPAN SPORTS DATA

*/

const teams = [
    
    {
        team: 'indianapolis colts',
        category: 'nfl',
        geoLocation: 'ind'
    },
    {
        team: 'indiana pacers',
        category: 'nba',
        geoLocation: 'ind'
    },
    {
        team: 'indiana fever',
        category: 'wnba',
        geoLocation: 'ind'
    }
]
// FUNCTIONS
async function getDataUrlIndeed(URL){
    
    let data = ''
    const response = await fetch(URL)
    data = response.text()
    return data
    
}

let urlIndeed = ''
for (let index = 0; index < teams.length; index++) {
    const getDataTeam = teams[index];
    urlIndeed = `https://www.espn.com/${getDataTeam.category}/team/_/name/${getDataTeam.geoLocation}/${getDataTeam.team.replaceAll(' ','-')}`
    //CALL FUNCTION
    let getEspnArrayData = getDataUrlIndeed(urlIndeed).then( content =>{
        let getArticleUrl, getArticleTitle, getArticleImage, getArticleImageAltName, getArticleDescription
        let objEspnData = []
        const $ = cheerio.load(content)
        let data = $('body script:not([src])').html().replace("window['__espnfitt__']=", '').replace('};', '}')
        let convertToJSON = JSON.parse(data)
        //console.log(convertToJSON)
        let getArticles = convertToJSON.page.content.clubhouse.columns.middleColumn.clubhouse.feed
        for (let index = 0; index < getArticles.length; index++) {
            const getItemArticle = getArticles[index];
            if(getItemArticle.link != null){
                getArticleTitle = getItemArticle.headline.replace('— ', '')
                getArticleDescription = getItemArticle.description.replace('— ', '')
                getArticleUrl = getItemArticle.link
                if(getItemArticle.image == null || getItemArticle.image == 'null'){
                    getArticleImageAltName = ''
                    getArticleImage = ''
                }else{
                    getArticleImageAltName = getItemArticle.image.name
                    getArticleImage = getItemArticle.image.url
                }
                objEspnData.push({
                    title: getArticleTitle,
                    description: getArticleDescription,
                    url: `https://www.espn.com${getArticleUrl}`,
                    altName: getArticleImageAltName,
                    image: getArticleImage,
                    team: getDataTeam.team.replaceAll(' ','_')
                })
            }
        }
        return objEspnData
    })
    getEspnArrayData.then(data =>{
        //UPLOAD FILE TO STRAPI
        for (let index = 0; index < data.length; index++) {
            //PREPARE NEW OBJECT
            let sendData = { 
                    title: data[index].title,
                    imageUrl: data[index].image,
                    extract: data[index].description,
                    url: data[index].url,
                    altName: data[index].altName,
                    category: 'sports',
                    content: ''
            }
            //CREATE FORMDATA
            let formData = new FormData()
            formData.set('data', JSON.stringify(sendData))
            const encoder = new FormDataEncoder(formData)
            //SEND FORMDATA TO STRAPI
            fetch('http://localhost:1337/api/news', {
                method: "post",
                headers: encoder.headers,
                body: Readable.from(encoder)
            })
            .then(response => {
                if(response.status === 200){
                    console.log('Epsn article '+data[index].title+' Submit')
                }else{
                    console.log('Error')
                }
            })
            .catch(error =>{
                console.log(error)
            })
        }
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
        fs.writeFileSync(path.join(getRootFile,'tmp') + "/espn_"+data[0].team+'_'+getDay+"_"+getMount+"_"+getYear+"_"+getHours+"_"+getMinutes+".json",JSON.stringify(data),{encoding: "utf8",flag: "w",mode: 0o666});
    })
}

