const fs = require('fs');
const path = require("path");

// когда мы читаем файл, реально читаются байты (буфер)
// но мы-то знаем, что в файле лежит utf8-строка, поэтому сразу говорим - представь нам прочитанное в виде utf8-строки
let txt_data=fs.readFileSync(path.resolve(__dirname,"data","data_utf8.txt"),"utf8");
console.log("текстовые данные в запрошенной кодировке:");
console.log(txt_data,"|",txt_data[0],"|",txt_data[1],"|",txt_data.length);
console.log(txt_data,"|",txt_data[0].charCodeAt(),"|",txt_data[1].charCodeAt(),"|",txt_data.length);

// если явно не запросить представление в виде строки - получим просто буфер, массив байтов
let buffer_data=fs.readFileSync(path.resolve(__dirname,"data","data_utf8.txt"));
console.log("те же данные в виде буфера:");
console.log(buffer_data,buffer_data.length);
// кроме букв, видим в начале строки байты ef bb bf - это utf8-символ BOF, begin of file

// буфер можно преобразовать в строку, по-умолчанию предполагается что буфер представляет байты utf8-строки
console.log(buffer_data.toString());
console.log(buffer_data.toString('utf-8'));
