﻿const express = require('express');
const path = require('path');
const fs = require('fs');
const querystring = require('querystring');

const { logLineSync } = require('../../utils/utils');

const webserver = express();

const port = 4022;
const logFN = path.join(__dirname, '_server.log');

webserver.get("/mysite/*", (req, res) => { 

    // мы будем часть "сырого" УРЛа (req.originalUrl) использовать как имя файла в файловой системе
    // но в УРЛе пробелы, русские буквы и другие символы кодируются в формат www-form-urlencoded (из " " получается "%20", из "п" - "%D0%BF")
    // а в именах файлов в файловой системе такое кодирование не применяется
    // в браузере декодирование из формата www-form-urlencoded в обычную строку делается вызовом decodeURIComponent
    // под Node.js - вызовом querystring.unescape
    // в req.params (данные из частей УРЛа, пока не проходили), req.query (get-данные), req.body (post-данные) это декодирование уже сделано
    const originalUrlDecoded=querystring.unescape(req.originalUrl);
    logLineSync(logFN,`[${port}] `+"static server called, originalUrl="+req.originalUrl+", originalUrlDecoded="+originalUrlDecoded);

    const filePath=path.resolve(__dirname,"../site_football",originalUrlDecoded.substring(8)); // 8 тут - magic number, в промышленном коде надо покрасивее

    try {
        const stats=fs.statSync(filePath); // узнаём, есть ли ЭТО в папке site_football, и что ЭТО - папка или файл
        if ( stats.isFile() ) {
            console.log("отдаём файл",filePath);
            const fileStream=fs.createReadStream(filePath); // или можно res.sendFile, но нам пока надо так
            fileStream.pipe(res); 
        }   
        else {
            console.log("запрошена папка",filePath);
            res.status(403).end(); // это папка, вернём 403 - запрещено
        }
    }
    catch ( err ) {
        console.log("ошибка проверки файла",filePath,err.code);
        res.status(404).end(); // будем думать что может быть только одна ошибка - файл не найден
    }

});

webserver.listen(port,()=>{
    logLineSync(logFN,"web server running on port "+port);
});
