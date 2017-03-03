/**
 * Created by llan on 2017/3/3.
 */
const rp = require('request-promise');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const test = async(page = 1, id = 8888)=> {
    const options = {
        uri: 'http://www.ourocg.cn/Cards/View-8214',
        transform: function (body) {
            return cheerio.load(body);
        }
    };
    rp(options)
        .then(function ($) {
            let info = {};
            $('.val').each((i, item)=> {
                info[i] = $(item).text();
            });
            return info;
        })
        .catch(function (err) {
            fs.writeFileSync(path.join(__dirname, 'logs', `${page}-error.txt`), `\n第${page}页,id为${id}爬虫发生错误,错误名称${err.name},错误码${err.statusCode
                },错误信息${err.message}`, {
                flag: 'a'
            });
        });
};
test();
