import fetch from "node-fetch";
import cheerio from "cheerio";
import fs from "fs"
import { FormData } from "formdata-node";
import {FormDataEncoder} from "form-data-encoder"
import {Readable} from "stream"
import path from "path";

/*

INDEED DATA

*/
const geoLocation = 'Indianapolis'
const urlIndeed = `https://www.indeed.com/jobs?q=&l=${geoLocation}&start=`

async function getDataUrlIndeed(URL, page){
    let data = ''
    const indexPage = page * 10;
    const response = await fetch(URL+indexPage)
    data = response.text()
    return data
}

const getIndeedArrayData = getDataUrlIndeed(urlIndeed, 3).then( content =>{
    let title, description, companyName, rating, companyLocation, salary, href
    let objJobs = []
    const $ = cheerio.load(content)
    $('ul.jobsearch-ResultsList li').each(function (index, element) {
        href = $(element).find('.job_seen_beacon table tbody tr .resultContent .jobTitle a').attr('href')
        title = $(element).find('.job_seen_beacon table tbody tr .resultContent .jobTitle a span').text()
        companyName = $(element).find('.job_seen_beacon table tbody tr .resultContent .company_location .companyName a').text()
        rating = $(element).find('.job_seen_beacon table tbody tr .resultContent .company_location .ratingsDisplay a span span').text()
        companyLocation = $(element).find('.job_seen_beacon table tbody tr .resultContent .company_location .companyLocation').text()
        description = $(element).find('.job_seen_beacon table tbody tr td .result-footer .job-snippet ul li').text()
        salary = $(element).find('.job_seen_beacon table tbody tr .resultContent .salaryOnly .attribute_snippet').text()
        
        if(href != undefined && title != '' && companyName != '' && rating != '' && companyLocation != '' && description != '' && salary != ''){
            objJobs.push({
                titleJob: title,
                companyNameJob: companyName,
                companyLocationJob: companyLocation,
                companyDescription: description,
                companySalary: salary,
                companyRating: rating,
                href: `https://www.indeed.com${href}`
            })
            /*
            //DEBUG
            
            console.log('-----------')
            console.log(href)
            console.log(title)
            console.log(companyName)
            console.log(rating)
            console.log(companyLocation)
            console.log(description)
            console.log(salary)
            console.log('-----------')

            */
        }
    });
    return objJobs
})

getIndeedArrayData.then(data =>{
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
        fs.writeFileSync(path.join(getRootFile,'tmp') + "/indeed"+getDay+"_"+getMount+"_"+getYear+"_"+getHours+"_"+getMinutes+".json",JSON.stringify(data),{encoding: "utf8",flag: "w",mode: 0o666});
})
