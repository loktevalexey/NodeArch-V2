const { logLine } = require('./utils');
const { selectQueryFactory } = require("./utils_db");

// приходится экспортировать это тут, заранее, т.к. blocks.js импортирует composeContent из этого модуля!
module.exports={
    composeContent,
};

const { 
    composeBlock_Header,composeBlock_FormattedText,
    composeBlock_Search,
    composeBlock_Image,
    composeBlock_WeatherForecast,
    composeBlock_Banner,
    composeBlock_Contacts,
    composeBlock_News,
    composeBlock_URLNew_Header,composeBlock_URLNew_Text,
    composeBlock_URLIndPage_Text,
    composeBlock_Container_LtR,composeBlock_Container_2Col,
} = require("./blocks");

async function composeContent(contentId,coreData,appData) {

    // получим список блоков, составляющих этот контент
    let contentBlocks=await selectQueryFactory(coreData.connection, `
        select cb.id, cb.block_type, bt.code block_type_code, cb.block_attributes
        from contents_blocks cb, block_types bt
        where cb.content=? and cb.block_type=bt.id
        order by cb.content_ord
    ;`, [contentId]);

    let contentHTMLs=[];
    for ( let cb=0; cb<contentBlocks.length; cb++ ) {
        const contentBlock=contentBlocks[cb];

        // у каждого блока могут быть индивидуальные опции в поле block_attributes, распарсим в объект
        let blockAttributes={};
        if ( contentBlock.block_attributes && contentBlock.block_attributes.trim() ) {
            try {
                blockAttributes=JSON.parse(contentBlock.block_attributes);
            }
            catch ( err ) {
                // исключения не должны ломать страницу! максимум - надо просто пропустить кривой блок, мы же попробуем продолжить без атрибутов
                logLine(coreData.logFN,`cannot parse block id=${contentBlock.id} attributes`);
            }
        }

        let blockHTML='';

        switch ( contentBlock.block_type_code ) {
            case 'HEADER':
                blockHTML=await composeBlock_Header(coreData,appData,blockAttributes);
                break;
            case 'FORMATTED_TEXT':
                blockHTML=await composeBlock_FormattedText(coreData,appData,blockAttributes);
                break;        
            case 'IMAGE':
                blockHTML=await composeBlock_Image(coreData,appData,blockAttributes);
                break;                
            case 'SEARCH':
                blockHTML=await composeBlock_Search(coreData,appData,blockAttributes);
                break;
            case 'BANNER':
                blockHTML=await composeBlock_Banner(coreData,appData,blockAttributes);
                break;
            case 'CONTACTS':
                blockHTML=await composeBlock_Contacts(coreData,appData,blockAttributes);
                break;
            case 'WEATHER_FORECAST':
                blockHTML=await composeBlock_WeatherForecast(coreData,appData,blockAttributes);
                break;
            case 'NEWS_LIST':
                blockHTML=await composeBlock_News(coreData,appData,blockAttributes);
                break;
            case 'URL_NEW_HEADER':
                blockHTML=await composeBlock_URLNew_Header(coreData,appData,blockAttributes);
                break;
            case 'URL_NEW_TEXT':
                blockHTML=await composeBlock_URLNew_Text(coreData,appData,blockAttributes);
                break;            
            case 'URL_INDPAGE_TEXT':
                blockHTML=await composeBlock_URLIndPage_Text(coreData,appData,blockAttributes);
                break;            
            case 'CONTAINER_LTR':
                blockHTML=await composeBlock_Container_LtR(coreData,appData,blockAttributes);
                break;        
            case 'CONTAINER_2COL':
                blockHTML=await composeBlock_Container_2Col(coreData,appData,blockAttributes);
                break;        
            default:
                logLine(coreData.logFN,`cannot compose block id=${contentBlock.id} - type code ${contentBlock.block_type_code} unknown`);
        }

        contentHTMLs.push(blockHTML);
    }

    return contentHTMLs;
}
