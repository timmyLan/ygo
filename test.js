const sleep = (ms = 0) => {
    return new Promise(r => setTimeout(r, ms));
};
const total = 10;
const start = async(page)=> {
    for (let i = 0; i < 10; i++) {
        //每个爬虫等待10s
        await sleep(500);
        console.log(`第${page}页第${i}条数据爬虫开始~`);
        //爬虫结束
        if (i === 10 - 1) {
            console.log(`第${page}页爬虫结束~`);
            if (page == total) {
                console.log('爬虫结束,正在关闭redis数据库~');
            }
        }
    }
};
(async()=> {
    for (let j = 1; j <= 10; j++) {
        await start(j);
    }
})();


