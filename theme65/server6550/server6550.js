﻿const express = require('express');
var session = require('express-session')
const path = require('path');

const { logLineAsync } = require('../../utils/utils');

const webserver = express();

const port = 6550;

const logFN = path.join(__dirname, '_server.log');

webserver.use(session({
    secret: 'ANY_SECRET_TEXT', // используется для подписи сессионного кука, может быть любым текстом
    resave: false,
    saveUninitialized: true
}));

webserver.use(function (req, res, next) {
    
    // req.session - это данные сессии, т.е. данные ЭТОГО посетителя
    if (!req.session.views) {
        req.session.views = {}; 
        // здесь будем хранить информацию, какая страница сколько раз просмотрена ЭТИМ посетителем
        // ключ - УРЛ страницы, значение - количество просмотров этой страницы ЭТИМ посетителем
    }
   
    // счётчик просмотров этой страницы этим посетителем увеличиваем на 1
    req.session.views[req.originalUrl] = 
      (req.session.views[req.originalUrl] || 0) + 1; 
   
    next();
});
   
webserver.get('/page1.html', function (req, res, next) {
    res.send('эту страницу ВЫ смотрели ' + req.session.views[req.originalUrl] + ' раз');
});
   
webserver.get('/page2.html', function (req, res, next) {
    res.send('эту страницу ВЫ смотрели ' + req.session.views[req.originalUrl] + ' раз');
});

webserver.listen(port,()=>{
    logLineAsync(logFN,"web server running on port "+port);
});
