//NOTE - IT WORKS IN COMBINATION WITH lambda 010
// modules
const AWS = require('aws-sdk');
// Require and initialize outside of your main handler
const mysql = require('serverless-mysql')();

const f4Api = require('f4Api');
const saveAssetsCalls = require('saveAssetsCalls');
const { sleep } = require('utility');
const saveAssetsProductRelation = require('saveAssetsProductRelation');

// vars
const chunkOffset = process.env.F4_MAX_META_FIELDS;
const maxPromiseCalls = process.env.F4_MAX_PROMISE_CALLS;

exports.handler = async (event, context) => {
    mysql.config({
        host     : event.RDS_HOSTNAME,
        database : event.RDS_DATABASE,
        user     : event.RDS_USERNAME,
        password : event.RDS_PASSWORD
    });
    
    const fields = [1,3, 4, 5, 6, 7, 8, 12, 25, 31, 32, 33, 34, 35, 36, 37, 40, 44, 46, 47, 49, 50, 53];
    //const fields = [1,3, 4, 6, 7];
    const iter = Array.from(Array(Math.ceil(fields.length / chunkOffset)).keys());
        
    let sqlQuery = "SELECT COUNT(*) as toBeProcessed FROM assets_call";
    const res = await mysql.query(sqlQuery);
    
    if (res[0].toBeProcessed < 1) {
        const sqlLambaVar = 'UPDATE lambda_var as l1 SET l1.value = (SELECT value FROM (SELECT * FROM lambda_var) as l2 WHERE l2.var="job_close_date") WHERE l1.var="job_start_date"';
        await mysql.query(sqlLambaVar);
         
        const date = new Date();
        const today = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' +  date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
  
        const assetCall = iter.map((i) => {
            const start = i*chunkOffset;
            const end = (i*chunkOffset) + parseInt(chunkOffset);
            const params = fields.slice(start, end);
            sleep(Math.floor(Math.random() * 1000));
            return saveAssetsCalls(params,event, mysql); 
        });
        
        await Promise.all(assetCall);
        
        const sqlLambdaVar = 'UPDATE lambda_var SET value = "'+today+'" WHERE var="job_close_date"';
        await mysql.query(sqlLambdaVar);
    }
    
    
    sqlQuery = "SELECT submodule_id, page FROM assets_call GROUP BY submodule_id, page LIMIT "+maxPromiseCalls;
    const assetsToRead = await mysql.query(sqlQuery);
    
    if(assetsToRead.length>0){
        const assetsCalls = assetsToRead.map(asset => {
            sqlQuery = "SELECT url FROM assets_call WHERE submodule_id="+asset.submodule_id+" AND page="+asset.page;
            return mysql.query(sqlQuery);
        });
       
        let assetsCallsArray = await Promise.all(assetsCalls);
        
        assetsCallsArray = [].concat.apply([], assetsCallsArray);
        
        
        const assetsArray = await Promise.all(assetsCallsArray.map(item =>{
            return f4Api((item.url).replace(/\'/g, ''),event);
        }));
    
        const assetsToMerge = assetsArray.filter(page => page.hasOwnProperty('assets'))
            .map(page => page.assets)
            .reduce((prev, curr, idx) => {
                return prev.concat(curr);
            });
        
        let assets = {};
     
        assetsToMerge.map((item) => {
                Object.keys(item).map((key) => {
                    if (!assets[item.id]) assets[item.id] = {};
                    assets[item.id][key] = item[key];
                });
        });
        
        assets = Object.values(assets);
        //assets = assetsToMerge;
        
        //keep the relational table assets_product in sync 
        await saveAssetsProductRelation(assets, event, mysql);
        
        // Run clean up function
        await mysql.end();
        
        const rSet = {};
        rSet["assets"] = assets;
        rSet["assetsCallRec"] = assetsToRead;
        
        context.succeed(rSet);
    }
    
    context.succeed();
};