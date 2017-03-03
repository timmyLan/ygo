const cheerio = require('cheerio'),
    rp = require('request-promise'),
    fs = require('fs'),
    path = require('path'),
    //use 'then-redis' to support promises
    createClient = require('then-redis').createClient,
    client = createClient();

let models = require('./models');
const baseUrl = 'http://www.ourocg.cn/Cards/';
const listUrl = `${baseUrl}Lists-5-`;
const viewUrl = `${baseUrl}View-`;
/**
 * 链接redis
 */
client.on("error", function (err) {
    console.log("Error " + err);
});
//获取搜索页
let spiderPage = client.get('spiderPage') ? client.get('spiderPage') : 1;
/**
 * 链接mysql数据库
 */
const connect = ()=> {
    models.sequelize.sync(
        {
            'force': true
        }
    ).then(()=> {
        console.log('success to connect mysql~');
    })
};
/**
 * 获取总页数
 * @param url
 * @param page
 */
const getPages = async(url, page)=> {
    const options = {
        uri: `${url}${page}`,
        headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.99 Safari/537.36'
        }
    };
    try {
        let res = await rp(options),
            $ = cheerio.load(res);
        return $('#pdata').attr('totpage');
    } catch (err) {
        fs.writeFileSync(path.join(__dirname, 'logs', `getPages-error.txt`), `获取总页数爬虫发生错误,错误名称${err.name},错误码${err.statusCode
            },错误信息${err.message}`, {
            flag: 'a'
        });
    }
};
/**
 * 获取详情页信息
 * @param url
 * @param id
 * @param page
 * @returns {{}}
 */
const getInfo = async(url, id, page)=> {
    const options = {
        uri: `${url}${id}`,
        headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.99 Safari/537.36'
        }
    };
    try {
        let res = await rp(options),
            $ = cheerio.load(res);
        //成功获取详情页信息
        //将成功获取详情页的id储存到redis中,作比较
        client.sadd(`${page}-spider`, id);
        console.log('here');
        let info = {};
        $('.val').each((i, item)=> {
            info[i] = $(item).text();
        });
        return info;
    } catch (err) {
        fs.writeFileSync(path.join(__dirname, 'logs', `${page}-error.txt`), `\n第${page}页,id为${id}爬虫发生错误,错误名称${err.name},错误码${err.statusCode
            },错误信息${err.message}`, {
            flag: 'a'
        });
    }
};
/**
 * 延迟循环函数 每delay秒执行一次spider函数 获取信息
 * @param curIter 当前迭代下标
 * @param $item 数据源
 * @param page 当前爬虫页
 * @param maxIter 迭代次数
 * @param delay 延迟(秒)
 */
const runAgain = async(curIter, $item, page, maxIter, delay)=> {
    await spider(curIter, $item, page);
    setTimeout(function () {
        ++curIter;
        if (curIter < maxIter)
            runAgain(curIter, $item, page, maxIter, delay);
    }, delay)
};
/**
 * 爬虫函数
 * @param curIter 当前迭代
 * @param $item 数据源
 * @param page 当前爬虫页
 */
const spider = async(curIter, $item, page)=> {
    let errorInfo = [];
    let carId = $item.eq(curIter).attr('card_id');
    console.log('carId', carId, typeof(carId));
    let spidered = await client.smembers(`${page}-spider`);
    console.log('spidered', spidered, typeof (spidered));
    console.log('indexOf', spidered.indexOf(carId));
    //若已采集过, 则不再爬虫
    if (spidered.indexOf(carId) < 0) {
        let carInfo = await getInfo(viewUrl, carId, page);
        console.log('carInfo', carInfo);
        let cnName = carInfo[0],
            JapanName = carInfo[1],
            enName = carInfo[2],
            type = carInfo[3],
            keyCode = carInfo[4],
            limit = carInfo[5],
            exclusive = carInfo[6];
        if (carInfo[3].indexOf('魔法') > 0) {
            let rare = carInfo[7],
                cardPack = carInfo[8],
                effect = carInfo[9];
            models.Magic.create({
                type: type,
                effect: effect,
                JapanName: JapanName,
                cnName: cnName,
                enName: enName,
                limit: limit,
                exclusive: exclusive,
                rare: rare,
                cardPack: cardPack,
                carId: carId,
                keyCode: keyCode
            });
        } else if (carInfo[3].indexOf('陷阱') > 0) {
            let rare = carInfo[7],
                cardPack = carInfo[8],
                effect = carInfo[9];
            models.Trap.create({
                type: type,
                effect: effect,
                JapanName: JapanName,
                cnName: cnName,
                enName: enName,
                limit: limit,
                exclusive: exclusive,
                rare: rare,
                cardPack: cardPack,
                carId: carId,
                keyCode: keyCode
            });
        } else if (carInfo[3].indexOf('怪兽') > 0) {
            let tribe = carInfo[7],
                element = carInfo[8],
                star = carInfo[9],
                atk = carInfo[10],
                def = carInfo[11],
                rare = carInfo[12],
                cardPack = carInfo[13],
                effect = carInfo[14];
            models.Monster.create({
                type: type,
                effect: effect,
                JapanName: JapanName,
                cnName: cnName,
                enName: enName,
                limit: limit,
                exclusive: exclusive,
                rare: rare,
                cardPack: cardPack,
                carId: carId,
                keyCode: keyCode,
                tribe: tribe,
                element: element,
                star: star,
                atk: atk,
                def: def
            });
        } else {
            errorInfo.push(`第${page}页,第${i}条数据类型不属于指定(魔法/陷阱/怪兽)类型,无法获取数据.`);
        }
        if (errorInfo.length !== 0) {
            for (let j = 0; j < errorInfo.length; j++) {
                fs.writeFileSync(path.join(__dirname, 'logs', `${page}-error.txt`), `\n${errorInfo[j]}`, {
                    flag: 'a'
                });
            }
        }
    }
};
/**
 * 获取页面数据
 * @param url
 * @param page
 */
const getData = async(url, page)=> {
    console.log(`第${page}页开始爬虫`);
    const options = {
        uri: `${listUrl}${page}`,
        headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.99 Safari/537.36'
        }
    };
    try {
        let res = await rp(options),
            $ = cheerio.load(res);
        //获取页面数据成功
        //将成功获取数据页后一页码写入redis
        client.set('spiderPage', page + 1);
        let $item = $('.card-item');
        let maxIter = $item.length,
            delay = 10 * 1000,
            curIter = 0;
        runAgain(curIter, $item, page, maxIter, delay);
    } catch (err) {
        fs.writeFileSync(path.join(__dirname, 'logs', `${page}-error.txt`), `\n第${page}页爬虫发生错误,错误名称${err.name},错误码${err.statusCode
            },错误信息${err.message}`, {
            flag: 'a'
        });
    }
};

// const downLoadImg = async(imgUrl, imgId)=> {
//     const filePath = path.join(__dirname, 'downLoad');
// };

const start = async()=> {
    let total = await getPages(listUrl, 1);
    console.log('total', total);
    // connect();
    // for (let i = spiderPage; i <= total; i++) {
    //     getData(listUrl, i);
    // }
};
start();
