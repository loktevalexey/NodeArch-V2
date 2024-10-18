﻿const express = require('express');
const path = require('path');
const fsp = require('fs').promises; // используем API работы с файлами, основанное на промисах
const querystring = require('querystring');
const Jimp = require('jimp');

const { logLineSync, getTempFileName } = require('../../utils/utils');

const webserver = express();

const port = 4036;
const logFN = path.join(__dirname, '_server.log');

webserver.use(
    "/image",
    express.static(path.resolve(__dirname,"images_full"))
);

webserver.get(/^\/image\/(([a-zA-Z\d]+)_thumb\.(jpg|jpeg|gif|png))$/, async (req, res) => {

    // попадающие сюда УРЛы попадают сначала в предыдущий обработчик
    // и если он нашёл файл с таким именем в папке images_full - он его возвращает клиенту и цепочка обработчиков прерывается
    // а если не нашёл - цепочка обработчиков продолжается и мы попадаем сюда

    const fullFileName=querystring.unescape(req.params[0]); // если УРЛ для обработчика задан регуляркой, то в req.params попадает каждая скобочная группа из регулярки
    const fileNameOnly=querystring.unescape(req.params[1]);
    const fileExtName=querystring.unescape(req.params[2]); // тут не может быть никаких особых символов, но лучше всегда unescape-ить всё что взято напрямую из УРЛа
    logLineSync(logFN,`[${port}] пришёл запрос на автоуменьшенную картинку, полное имя файла = ${fullFileName}, имя исходного файла = ${fileNameOnly}, расширение исходного файла = ${fileExtName}`);

    const thumbPFN=path.resolve(__dirname,"images_thumb",fullFileName);

    // сначала проверим, может маленькая картинка уже готовая лежит в папке images_thumb
    try {
        const stats=await fsp.stat(thumbPFN);
        if ( stats.isFile() ) {
            logLineSync(logFN,`[${port}] есть готовая маленькая картинка ${fullFileName}, отдаём её`);
            res.sendFile( thumbPFN );
        }   
        else {
            res.status(403).end(); // картинка есть, но она не файл, что-то пошло не так, вернём 403 - запрещено
        }
    }
    catch ( err ) {
        logLineSync(logFN,`[${port}] нет готовой маленькой картинки ${fullFileName}, будем сжимать большую и сохранять результат на будущее`);

        const originPFN=path.resolve(__dirname,"images_full",`${fileNameOnly}.${fileExtName}`);
        let compressStartDT=new Date();
        await compressImage(originPFN,thumbPFN,300);
        let compressDurationMS=(new Date())-compressStartDT;
        logLineSync(logFN,`[${port}] сохранена маленькая картинка ${fullFileName}, сжатие заняло ${compressDurationMS} мс`);
        
        res.sendFile( thumbPFN );
    }

});

webserver.listen(port,()=>{
    logLineSync(logFN,"web server running on port "+port);
});

// масштабирует картинку из sourcePFN в resultPFN с указанной шириной с сохранением пропорций
async function compressImage(sourcePFN, resultPFN, newWidth) {

    let result = await Jimp.read(sourcePFN);
    const {width, height} = result.bitmap; // это размеры большой картинки

    let newHeight = height/width*newWidth; // ширину маленькой картинки знаем, вычисляем высоту маленькой

    // при любом способе записи файла он некоторое время виден в файловой системе с длиной 0
    // а у нас в get-запросе определяется, нет ли уже сохранённого файла с нужным именем, и пустой будет обнаружен и возвращён клиенту
    // поэтому, ВСЕГДА сначала (медленно) пишем в файл со ВРЕМЕННЫМ именем, а потом переименовываем файл в нужное имя (это моментально)

    // но временное имя файла надо сделать с таким же расширением, с каким будет постоянное
    // т.к. jimp определяет ФОРМАТ записи (jpeg/png) по РАСШИРЕНИЮ файла (глупо, конечно)
    let resultTempPFN=getTempFileName(resultPFN);

    result.resize(newWidth, newHeight);
    result.quality(100);
    await result.writeAsync(resultTempPFN); // медленно пишем в файл со временным именем

    await fsp.rename(resultTempPFN,resultPFN); // быстро переименовываем в нужное имя
}
