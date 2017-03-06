const cheerio = require('cheerio'),
    rp = require('request-promise'),
    fs = require('fs'),
    path = require('path'),
    //use 'then-redis' to support promises
    createClient = require('then-redis').createClient,
    client = createClient();
//导入数据模型
let models = require('./models');
//爬虫用的url字符串
const baseUrl = 'http://www.ourocg.cn/Cards/';
const listUrl = `${baseUrl}Lists-5-`;
const viewUrl = `${baseUrl}View-`;
//需要搜索总页数
let total = 0;
//搜索延迟(ms)
let delay = 10 * 1000;
/**
 * 链接mysql数据库 & 监听redis数据库
 */
const connect = ()=> {
    models.sequelize.sync(
        // {
        //     'force': true
        // }
    ).then(()=> {
        console.log('success to connect mysql~');
    });
    client.on("error", function (err) {
        console.log("Error " + err);
    });
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
        let info = {};
        $('.val').each((i, item)=> {
            if ($(item).hasClass('effect') && $(item).children().hasClass('subtext')) {
                //该怪兽为灵摆怪兽
                $(item).find('.subtext').each((j, sub)=> {
                    info[i + j] = $(sub).text();
                });
            } else {
                info[i] = $(item).text();
            }
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
 * 延迟函数
 * @param ms 延迟(毫秒)
 * @returns {Promise}
 */
const sleep = (ms = 0) => {
    return new Promise(r => setTimeout(r, ms));
};

/**
 * 爬虫函数
 * @param $item 当前爬虫数据源
 * @param page 当前爬虫页
 */
const spider = async($item, page)=> {
    let errorInfo = [];
    let carId = $item.attr('card_id');
    let spidered = await client.smembers(`${page}-spider`);
    //若已采集过, 则不再爬虫
    if (spidered.indexOf(carId) < 0) {
        //爬虫间隔时间为10s
        delay = 10 * 1000;
        let carInfo = await getInfo(viewUrl, carId, page);
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
            await models.Magic.create({
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
            await models.Trap.create({
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
                effect = '';
            if (Object.keys(carInfo).length > 16) {
                //该怪兽为灵摆怪兽
                let scale = carInfo[14],
                    scaleEffect = carInfo[15];
                effect = carInfo[16];
                await models.Monster.create({
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
                    def: def,
                    scale: scale,
                    scaleEffect: scaleEffect
                });
            } else {
                effect = carInfo[14];
                await models.Monster.create({
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
            }
        } else {
            errorInfo.push(`第${page}页,第${i}条数据类型不属于指定(魔法/陷阱/怪兽)类型,无法获取数据.`);
        }
        //成功获取详情页信息
        //将成功获取详情页的id储存到redis中,作比较
        client.sadd(`${page}-spider`, carId);
        if (errorInfo.length !== 0) {
            for (let j = 0; j < errorInfo.length; j++) {
                fs.writeFileSync(path.join(__dirname, 'logs', `${page}-error.txt`), `\n${errorInfo[j]}`, {
                    flag: 'a'
                });
            }
        }
    } else {
        //若已经爬取的数据,则将延迟时间改为0s
        delay = 0;
        console.log(`第${page}页卡片id为${carId}的卡片信息已在数据库,不再进行爬虫`);
    }
};
/**
 * 获取页面数据
 * @param url
 * @param page
 */
const getData = async(url, page)=> {
    console.log(`第${page}页爬虫开始~`);
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
        let $item = $('.card-item');
        for (let i = 0; i < $item.length; i++) {
            //每个爬虫等待delay秒
            await sleep(delay);
            //爬虫开始
            await spider($item.eq(i), page);
            //爬虫结束
            if (i === $item.length - 1) {
                console.log(`第${page}页爬虫结束~`);
                //将成功获取数据页后一页码写入redis
                client.set('spiderPage', page + 1);
                if (page == total) {
                    console.log('爬虫结束,正在关闭redis数据库~');
                    client.quit();
                }
            }
        }
    } catch (err) {
        fs.writeFileSync(path.join(__dirname, 'logs', `${page}-error.txt`), `\n第${page}页爬虫发生错误,错误名称${err.name},错误码${err.statusCode
            },错误信息${err.message}`, {
            flag: 'a'
        });
    }
};

const start = async()=> {
    total = await getPages(listUrl, 1);
    const spiderPage = await client.get('spiderPage') ? await client.get('spiderPage') : 1;
    connect();
    for (let i = Number(spiderPage); i <= total; i++) {
        await getData(listUrl, i);
    }
};
start();
