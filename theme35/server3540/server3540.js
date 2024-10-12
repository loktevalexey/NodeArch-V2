﻿const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const { logLineSync } = require('../../utils/utils');

const webserver = express();

webserver.use(express.json()); // мидлварь, умеющая обрабатывать тело запроса в формате JSON
webserver.use(anyBodyParser);  // это самописная мидлварь, которая тело запроса в виде строки XML помещает в req.rawBody
webserver.use(bodyParser.text()); // мидлварь, умеющая обрабатывать тело запроса в текстовом формате (есть и bodyParser.json())

const port = 3540;
const logFN = path.join(__dirname, '_server.log');

// т.к. к /service1 будет обращение со страниц с другим origin через AJAX методом POST, то браузер будет делать предварительный (preflight) запрос методом OPTIONS
// в заголовках ответа надо и разрешить обращаться со страниц с любым origin, и разрешить те заголовки запроса которые мы готовы обрабатывать
webserver.options('/service1', (req, res) => { 
    logLineSync(logFN,`[${port}] `+"service1 preflight called");

    res.setHeader("Access-Control-Allow-Origin","*");
    res.setHeader("Access-Control-Allow-Headers","Content-Type");

    res.send(""); // сам ответ на preflight-запрос может быть пустым
});

webserver.post('/service1', (req, res) => { 
    logLineSync(logFN,`[${port}] `+"service1 called");

    console.log("request headers",req.headers);
    const contentType=req.headers['content-type'];

    if ( contentType==="application/json" ) {
        logLineSync(logFN,"получено тело запроса в формате JSON");
        logLineSync(logFN,req.body.aaa+" "+req.body.bbb); // тело запроса преобразовано мидлварью express.json() в объект
    }
    else if ( contentType==="application/xml" ) {
        logLineSync(logFN,"получено тело запроса в формате XML");
        logLineSync(logFN,req.rawBody); // мидлварь anyBodyParser поместила тело запроса в req.rawBody; есть и специализированные мидлвари для этого
    }
    else {
        logLineSync(logFN,"получено тело запроса в формате "+contentType);
        logLineSync(logFN,req.body); // тело запроса осталось неизменённым, как прислал клиент
    }

    res.setHeader("Access-Control-Allow-Origin","*");
    res.setHeader("Access-Control-Allow-Headers","Content-Type");
    res.send("");
});

webserver.listen(port,()=>{
    logLineSync(logFN,"web server running on port "+port);
});

function anyBodyParser(req, res, next) {
    // мидлварь трактует тело запроса как текст, кладёт его в req.rawBody
    // мы будем использовать её именно если тело запроса - в формате XML
    const contentType=req.headers['content-type'];
    if ( contentType==="application/xml" ) {
        var data = '';
        req.setEncoding('utf8');
        req.on('data', function(chunk) { 
            data += chunk;
        });
        req.on('end', function() {
            req.rawBody = data;
            next();  // rawBody заполнено, вызываем следующую мидлварь в цепочке мидлварей
        });
    }
    else
        next(); // раз это не запрос в формате XML, сразу вызываем следующую мидлварь
}
