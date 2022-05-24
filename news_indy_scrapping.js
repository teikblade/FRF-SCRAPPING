import fetch from "node-fetch";
import cheerio from "cheerio";
import fs from "fs"
import { FormData } from "formdata-node";
import {FormDataEncoder} from "form-data-encoder"
import {Readable} from "stream"
import path from "path";

/*

WTHR.COM DATA

*/

const url = `https://www.wthr.com/local`

async function getDataUrlIndeed(URL){
    let data = ''
    const response = await fetch(URL)
    data = response.text()
    return data
}
getDataUrlIndeed(url).then( content =>{ 
    //LOAD DATA OF DOCUMENT INDEX.HTML
    const $ = cheerio.load(content)
    let hrefPost
    $('div.grid__main .grid__cell_columns_1 .grid__module .grid__module-sizer_name_headline-list .headline-list ul li').each((index, el)=>{
        //GET URL POST
        hrefPost = $(el).find('a').attr('href')
        let getPostData = getDataUrlIndeed(hrefPost).then( contentPost =>{ 
            //PREPARE VARIABLES
            let title, extract, image, thumbnail, objPost
            //LOAD DATA OF POST
            const $ = cheerio.load(contentPost)
            //EXTRACT DATA OF POST
            title = $('.page__grid .grid .grid__section_theme_default .grid__content .grid__main_sticky_right .grid__cell_columns_2 .grid__module .grid__module-sizer_name_article article .article__headline').text()
            extract = $('.page__grid .grid .grid__section_theme_default .grid__content .grid__main_sticky_right .grid__cell_columns_2 .grid__module .grid__module-sizer_name_article article .article__summary').text()
            try {
                image = $('.page__grid .grid .grid__section_theme_default .grid__content .grid__main_sticky_right .grid__cell_columns_2 .grid__module .grid__module-sizer_name_article article .article__lead-asset .photo .photo__image .photo__ratio-enforcer .photo__ratio-enforced div.lazy-image').find('.lazy-image__image_blur_true').attr('data-srcset').split(', ')
            } catch (error) {
                thumbnail = $('.page__grid .grid .grid__section_theme_default .grid__content .grid__main_sticky_right .grid__cell_columns_2 .grid__module .grid__module-sizer_name_article article .article__lead-asset div.video img.video__endslate-thumbnail').attr('src')
            }
            
            if(thumbnail == undefined){
                objPost ={
                    title: title,
                    extract: extract,
                    imageUrl: image[2],
                    altName: title,
                    url: hrefPost,
                    category: 'noticies'
                }
            }else{
                objPost = {
                    title: title,
                    extract: extract,
                    imageUrl: thumbnail,
                    altName: title,
                    url: hrefPost,
                    category: 'noticies'
                }
            }
            return objPost
        })
        getPostData.then(content =>{ 
            //CREATE FORMDATA
            let formData = new FormData()
            formData.set('data', JSON.stringify(content))
            const encoder = new FormDataEncoder(formData)
            //SEND FORMDATA TO STRAPI
            fetch('http://localhost:1337/api/news', {
                method: "post",
                headers: encoder.headers,
                body: Readable.from(encoder)
            })
            .then(response => {
                if(response.status === 200){
                    console.log('Post '+content.title+' Submit')
                }else{
                    console.log('Error')
                }
            })
            .catch(error =>{
                console.log(error)
            })
        }) 
    }) 
})