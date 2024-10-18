﻿const express = require('express');
const path = require('path');
const fsp = require('fs').promises; // используем API работы с файлами, основанное на промисах
const querystring = require('querystring');
const Jimp = require('jimp');

const { logLineSync, getTempFileName } = require('../../utils/utils');

const webserver = express();

const port = 4037;
const logFN = path.join(__dirname, '_server.log');

// сюда будут попадать только ИДУЩИЕ СЕЙЧАС процессы сжатия картинок
let compressPromisesCache={}; // ключ - УРЛ к которому идёт обращение, значение - промис, возвращаемый compressImage

webserver.use(
    "/image",
    express.static(path.resolve(__dirname,"images_full"))
);

webserver.get(/^\/image\/(([a-zA-Z\d]+)_thumb\.(jpg|jpeg|gif|png))$/, async (req, res) => {

    const fullFileName=querystring.unescape(req.params[0]);
    const fileNameOnly=querystring.unescape(req.params[1]);
    const fileExtName=querystring.unescape(req.params[2]);
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

        if ( !(fullFileName in compressPromisesCache) ) {
            try {
                const originPFN=path.resolve(__dirname,"images_full",`${fileNameOnly}.${fileExtName}`);
                let compressStartDT=new Date();
                const compressPromise=compressImage(originPFN,thumbPFN,300);
                compressPromisesCache[fullFileName]=compressPromise; // запоминаем в кэше промисов - процесс сжатия сейчас идёт
                await compressPromise;
                delete compressPromisesCache[fullFileName]; // удаляем из кэша промисов - процесс закончился
                let compressDurationMS=(new Date())-compressStartDT;
                logLineSync(logFN,`[${port}] сохранена маленькая картинка ${fullFileName}, сжатие заняло ${compressDurationMS} мс`);
            }
            catch ( err ) {
                // в любой момент при работе с файлами может произойти исключение, тем более когда мы дёргаем пакет jimp
                // 1. надо УДАЛИТЬ ПРОМИС из кэша промисов, иначе он возможно останется в кэше и ветка ниже будет ВСЕГДА переиспользовать отменённый промис
                // 2. надо вывести ошибку в лог
                // 3. надо вернуть клиенту 500
                delete compressPromisesCache[fullFileName];
                logLineSync(logFN,`[${port}] ошибка при сжатии картинки ${fullFileName} - `+err);
                res.status(500).end();
            }
        }
        else {
            logLineSync(logFN,`[${port}] в кэше промисов сейчас есть процесс сжатия картинки ${fullFileName}, не будем запускать параллельно второй, будем ждать того же промиса`);
            const compressPromise=compressPromisesCache[fullFileName];
            await compressPromise;
        }
        
        res.sendFile( thumbPFN );
    }

});

webserver.listen(port,()=>{
    logLineSync(logFN,"web server running on port "+port);
});

// масштабирует картинку из sourcePFN в resultPFN с указанной шириной с сохранением пропорций
async function compressImage(sourcePFN, resultPFN, newWidth) {

    // намеренно придержим процесс масштабирования, иначе трудно увидеть что кэш промисов работает
    await new Promise( (resolve,reject) => { setTimeout(resolve,3000); } );

    let result = await Jimp.read(sourcePFN);
    const {width, height} = result.bitmap; // это размеры большой картинки

    let newHeight = height/width*newWidth; // ширину маленькой картинки знаем, вычисляем высоту маленькой

    let resultTempPFN=getTempFileName(resultPFN);

    result.resize(newWidth, newHeight);
    result.quality(100);
    await result.writeAsync(resultTempPFN);
    await fsp.rename(resultTempPFN,resultPFN);
}
