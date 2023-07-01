﻿    let ab=new ArrayBuffer(2); // создаём ArrayBuffer длиной 2 байта
    let ta16=new Uint16Array(ab); // создаём для него представление в виде беззнаковых 16-битных чисел
    ta16[0]=511; // у этого числа в старшем байте 1, а в младшем - 255
    // endianness у типизированных массивов всегда нативный для той платформы где выполняется код
    // т.е. если у нас big endian - то в нулевом байте ArrayBuffer сейчас 255, а в первом - 1 (т.е. старший байт в конце, поэтому big endian).
    // а если у нас little endian - всё наоборот
    let ta8=new Uint8Array(ab); // создаём для того же ArrayBuffer представление в виде беззнаковых 8-битных чисел (т.е. байтов)
    console.log("нулевой="+ta8[0]+" первый="+ta8[1]);
    if ( ta8[1]===1 ) 
        console.log("big endian detected!");
    else
        console.log("little endian detected!");
