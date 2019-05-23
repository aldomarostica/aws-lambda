// modules
const mysql = require('serverless-mysql')();
const elasticsearch = require('elasticsearch');
const AWS = require('aws-sdk');
AWS.config.region = 'eu-west-1';
const lambda = new AWS.Lambda();

//functions
const { sleep } = require('utility');
const { deleteIndex } = require('utility');
const { createIndex } = require('utility');
const { arrayRemove } = require('utility');

// vars
const EsMaxAssetsCall = process.env.ES_MAX_ASSETS_CALL;
    
exports.handler = async (event, context) => {

  const params = {
    FunctionName: '051_mediaportal_dep_pro',
    InvocationType: 'RequestResponse',
    LogType: 'Tail',
    Payload: '{"ES_MAX_ASSETS_CALL" : "'+EsMaxAssetsCall+'"}'
  };

  mysql.config({
    host     : event.RDS_HOSTNAME,
    database : event.RDS_DATABASE,
    user     : event.RDS_USERNAME,
    password : event.RDS_PASSWORD
  });
    
  const client = new elasticsearch.Client({
    host: {
      host: event.ELASTICSEARCH_HOST,
      port: event.ELASTICSEARCH_PORT,
      protocol: event.ELASTICSEARCH_SCHEME
    },
    log: 'debug'
  });
  
  //if products_call are empty i can prepare the statement injecting products inside assets json
  //const sqlCount = "select count(*) as totalRows from ((select * from assets_call) union (select * from products_call)) as ap";
  const sqlCount = "select count(*) as totalRows from products_call";
  const countResult = await mysql.query(sqlCount);
  
  if(countResult[0].totalRows < 1){
    //call 050_inject_prod_assets_dev
    try{
      await lambda.invoke(params).promise().then(async (data) => {
          
          //I ask only the last inserted records
          const sqlSelect = "SELECT * FROM asset WHERE publish = '1' ORDER BY data_mod ASC LIMIT "+EsMaxAssetsCall;
          const assetsDb = await mysql.query(sqlSelect);
            
          const assets = assetsDb.map(row => row.asset);
          const assetsLength = assets.length;
          
            //asset to delete
          const sqlAssetsToDelete = "SELECT id FROM asset WHERE publish = '0' ORDER BY data_mod ASC LIMIT "+EsMaxAssetsCall;
          const assetsDBToDelete = await mysql.query(sqlAssetsToDelete);
          
          const assetsToDelete = assetsDBToDelete.map(row => row.id);
          const assetsToDeleteLength = assetsToDelete.length;
          
          let insertError=0;
          let deleteError=0;
            
          if(assetsLength>0 || assetsToDeleteLength>0){
            if(assetsLength>0){
              //let body = assets.slice(start,end).map(item => {
              let body = assets.map(item => {
                let asset = JSON.parse(item);                
                return [{
                  'index':{
                    '_index' : event.ES_INDEX_NAME,
                    '_type' : 'asset',
                    '_id': asset.id
                  }},asset];
                
              }).reduce((prev,curr) => {
                return prev.concat(curr);
              });
              
              await client.bulk({
                body: body
              });
              
              //ADD THIS CONTROLL IN THE ES BULK CALLBACK
              if(!insertError){
                //delete processed assets
                const sqlDeleteNewProcessed = "DELETE FROM asset WHERE publish = '1' ORDER BY data_mod ASC LIMIT "+EsMaxAssetsCall;
                await mysql.query(sqlDeleteNewProcessed);
              }
            
            }
          
            if(assetsToDeleteLength>0){
                
              let bodyDelete = assetsToDelete.map( assetId => {
                
                return [{
                  'delete':{
                    '_index' : event.ES_INDEX_NAME,
                    '_type' : 'asset',
                    '_id': assetId
                  }
                }];
                
              }).reduce((prev,curr) => {
                return prev.concat(curr);
              });
              
              await client.bulk({
                body: bodyDelete
              });
              
              //ADD THIS CONTROLL IN THE ES BULK CALLBACK
              if(!deleteError){
                //delete processed assets
                const sqlDeleteOldProcessed = "DELETE FROM asset WHERE publish = '0' ORDER BY id ASC LIMIT "+EsMaxAssetsCall;
                await mysql.query(sqlDeleteOldProcessed);
              }
            }
            
          }
      }). catch(err => {
        context.fail(err);
      });
      
      
    } catch (err) {
      console.log(`invoke ERROR: ${err}`)
    }
  }
};
