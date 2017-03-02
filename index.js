const cheerio = require('cheerio'),
    rp = require('request-promise'),
    fs = require('fs'),
    path = require('path'),
    Promise = require('promise');

let models = require('./models');
const baseUrl = 'http://www.ourocg.cn/Cards/';
const listUrl = `${baseUrl}Lists-5-`;
const viewUrl = `${baseUrl}View-`;
/**
 * 链接数据库
 */
const connect = ()=> {
    models.sequelize.sync(
        // {
        //     'force': true
        // }
    ).then(()=> {
        console.log('success to connect mysql~');
    })
};
/**
 * 获取总页面数
 * @param url
 * @param page
 * @returns {jQuery}
 */
const getPages = async(url, page)=> {
    const res = await rp(`${url}${page}`);
    const $ = cheerio.load(res);
    return $('#pdata').attr('totpage');
};
/**
 * 获取详情页信息
 * @param url
 * @param id
 * @returns {{}}
 */
const getInfo = async(url, id)=> {
    console.log('getInfo', `${url}${id}`);
    const res = await rp(`${url}${id}`);
    const $ = cheerio.load(res);
    let info = {};
    $('.val').each((i, item)=> {
        info[i] = $(item).text();
    });
    return info;
};
/**
 * 延时函数,防止爬虫过快
 * @param curIter 当前迭代
 * @param $item 数据源
 * @returns {*}
 */
const task = function (curIter, $item) {
    return new Promise(function (resolve, reject) {
        setTimeout(function () {
            spider(curIter, $item);
            resolve();
        }, 100);
    });
};
/**
 * 循环执行延时函数
 * @param curIter 当前迭代
 * @param $item 数据源
 * @param maxIter 最多迭代次数
 * @param delay 延时
 */
const run = function (curIter, $item, maxIter, delay) {
    task(curIter, $item).then(function () {
        setTimeout(function () {
            ++curIter;
            if (curIter < maxIter)
                run(curIter, $item, maxIter, delay);
        }, delay)
    });
};
/**
 * 爬虫函数
 * @param curIter 当前迭代
 * @param $item 数据源
 */
const spider = (curIter, $item)=> {
    let carId = $item.eq(curIter).attr('card_id');
    console.log('carId',carId);
};
/**
 * 获取页面数据
 * @param url
 * @param page
 */
const getData = async(url, page)=> {
    console.log(`第${page}页开始爬虫`);
    let errorInfo = [];
    const res = await rp(`${listUrl}${page}`);
    const $ = cheerio.load(res);
    let $item = $('.card-item');
    let maxIter = $item.length,
        delay = 1000,
        curIter = 0;
    run(curIter, $item, maxIter, delay);
    //     let carId = $item.eq(i).attr('card_id');
    //     let carInfo = await getInfo(viewUrl, carId);
    //     let cnName = carInfo[0],
    //         JapanName = carInfo[1],
    //         enName = carInfo[2],
    //         type = carInfo[3],
    //         keyCode = carInfo[4],
    //         limit = carInfo[5],
    //         exclusive = carInfo[6];
    //     if (carInfo[3].indexOf('魔法') > 0) {
    //         let rare = carInfo[7],
    //             cardPack = carInfo[8],
    //             effect = carInfo[9];
    //         models.Magic.create({
    //             type: type,
    //             effect: effect,
    //             JapanName: JapanName,
    //             cnName: cnName,
    //             enName: enName,
    //             limit: limit,
    //             exclusive: exclusive,
    //             rare: rare,
    //             cardPack: cardPack,
    //             carId: carId,
    //             keyCode: keyCode
    //         });
    //     } else if (carInfo[3].indexOf('陷阱') > 0) {
    //         let rare = carInfo[7],
    //             cardPack = carInfo[8],
    //             effect = carInfo[9];
    //         models.Trap.create({
    //             type: type,
    //             effect: effect,
    //             JapanName: JapanName,
    //             cnName: cnName,
    //             enName: enName,
    //             limit: limit,
    //             exclusive: exclusive,
    //             rare: rare,
    //             cardPack: cardPack,
    //             carId: carId,
    //             keyCode: keyCode
    //         });
    //     } else if (carInfo[3].indexOf('怪兽') > 0) {
    //         let tribe = carInfo[7],
    //             element = carInfo[8],
    //             star = carInfo[9],
    //             atk = carInfo[10],
    //             def = carInfo[11],
    //             rare = carInfo[12],
    //             cardPack = carInfo[13],
    //             effect = carInfo[14];
    //         models.Monster.create({
    //             type: type,
    //             effect: effect,
    //             JapanName: JapanName,
    //             cnName: cnName,
    //             enName: enName,
    //             limit: limit,
    //             exclusive: exclusive,
    //             rare: rare,
    //             cardPack: cardPack,
    //             carId: carId,
    //             keyCode: keyCode,
    //             tribe: tribe,
    //             element: element,
    //             star: star,
    //             atk: atk,
    //             def: def
    //         });
    //     } else {
    //         errorInfo.push(`第${page}页,第${i}条数据类型不属于指定(魔法/陷阱/怪兽)类型,无法获取数据.`);
    //     }
    //     if (errorInfo.length !== 0) {
    //         for (let j = 0; j < errorInfo.length; j++) {
    //             fs.writeFileSync(path.join(__dirname, 'logs', `${page}-error.txt`), `\n${errorInfo[j]}`, {
    //                 flag: 'a'
    //             });
    //         }
    //     }
};

// const downLoadImg = async(imgUrl, imgId)=> {
//     const filePath = path.join(__dirname, 'downLoad');
// };

const start = async()=> {
    let total = await getPages(listUrl, 1);
    connect();
    getData(listUrl, 1);
};
getData(listUrl, 1);
// start();
