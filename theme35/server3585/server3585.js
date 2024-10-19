﻿const express = require('express');
const path = require('path');
const cors = require('cors');

const { logLineSync } = require('../../utils/utils');

const webserver = express();

const port = 3585;
const logFN = path.join(__dirname, '_server.log');

webserver.post('/service1', (req, res) => { 
    logLineSync(logFN,`[${port}] `+"service1 called");

    res.send("service1 ok");
});

webserver.options('/service2', (req, res) => { 
    logLineSync(logFN,`[${port}] `+"service2 preflight called");
    res.setHeader("Access-Control-Allow-Origin","*"); // разрешаем запросы с любого origin, вместо * здесь может быть ОДИН origin (протокол+домен+порт)
    //вместо * можно указать ОДИН origin в виде http://www.mysite.by
    //если надо разрешить обращения с нескольких origin:
    //const origin=req.get('origin');
    //if ( origin==="http://mobile.mysite.by" || origin==="http://desktop.mysite.by" )
    //    res.setHeader("Access-Control-Allow-Origin",origin);
    res.setHeader("Access-Control-Allow-Headers","Content-Type"); // разрешаем заголовок запроса Content-Type
    // в HTTP есть код ответа 204 - "пустой ответ", здесь именно это и нужно
    // но не все браузеры понимают код ответа 204 на запрос OPTIONS, лучше вернуть код ответа 200 и пустой ответ
    res.send(""); 
});
webserver.post('/service2', (req, res) => { 
    logLineSync(logFN,`[${port}] `+"service2 called");

    res.setHeader("Access-Control-Allow-Origin","*");
    res.send("service2 ok");
});

var CORSOptions = {
    origin: '*', // разрешаем запросы с любого origin, вместо * здесь может быть ОДИН origin
    optionsSuccessStatus: 200, // на preflight-запрос OPTIONS отвечать кодом ответа 200
};
webserver.options('/service3', cors(CORSOptions));  // включаем мидлварь cors в цепочку мидлварей, причём ответ не нужно прописывать - мидлварь его сама отправит
webserver.post('/service3', cors(CORSOptions), (req, res) => {  // включаем мидлварь cors в цепочку мидлварей
    logLineSync(logFN,`[${port}] `+"service3 called");

    res.send("service3 ok");
});

webserver.listen(port,()=>{
    logLineSync(logFN,"web server running on port "+port);
});
