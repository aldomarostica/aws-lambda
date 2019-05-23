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
  
  /*await deleteIndex(client, event.ES_INDEX_NAME);
  return;*/
  
  /*try{
    await createIndex(client, event.ES_INDEX_NAME);
  } catch(err){
    console.log(err);
  }
  return;*/
  
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
                
                const filenameDotIndex = asset['file_name'].lastIndexOf('.'); 
                const filename = asset['file_name'].substring(0,filenameDotIndex);
                const ext = asset['file_name'].substring((filenameDotIndex+1))
                
                switch(ext.toLowerCase()){
                  case 'tif':
                    asset['CDN_Thumb'] = filename+"_Thumb.jpeg";
                    asset['CDN_mLow'] = filename+"_mLow.jpeg";
                    asset['CDN_mMid'] = filename+"_mMid.jpeg";
                    asset['CDN_mHigh'] = filename+"_mHigh."+ext;
                  break;
                  case 'jpeg':
                  case 'jpg':
                    asset['CDN_Thumb'] = filename+"_Thumb.jpeg";
                    asset['CDN_mLow'] = filename+"_mLow.jpeg";
                    asset['CDN_mMid'] = filename+"_mMid.jpeg";
                    asset['CDN_mHigh'] = filename+"_mHigh.jpeg";
                  break;
                  case 'gif':
                    asset['CDN_Thumb'] = filename+"_Thumb.jpeg";
                    asset['CDN_mLow'] = filename+"_mLow.jpeg";
                    asset['CDN_mMid'] = filename+"_mMid.jpeg";
                    asset['CDN_mHigh'] = filename+"_mHigh.gif";
                  break;
                  case 'png':
                    asset['CDN_Thumb'] = filename+"_Thumb.jpeg";
                    asset['CDN_mLow'] = filename+"_mLow.jpeg";
                    asset['CDN_mMid'] = filename+"_mMid.jpeg";
                    asset['CDN_mHigh'] = filename+"_mHigh.png";
                  break;
                  case 'ai':
                    asset['CDN_Thumb'] = filename+"_Thumb.jpeg";
                    asset['CDN_mLow'] = filename+"_mLow.jpeg";
                    asset['CDN_mMid'] = filename+"_mMid.jpeg";
                    asset['CDN_mHigh'] = filename+"_mHigh.ai";
                  break;
                  case 'eps':
                    asset['CDN_Thumb'] = filename+"_Thumb.jpeg";
                    asset['CDN_mLow'] = filename+"_mLow.jpeg";
                    asset['CDN_mMid'] = filename+"_mMid.jpeg";
                    asset['CDN_mHigh'] = filename+"_mHigh.eps";
                  break;
                  case 'mov':
                    asset['CDN_Thumb'] = filename+"_Thumb.jpeg";
                    asset['CDN_mLow'] = filename+"_mLow.mov";
                    asset['CDN_mMid'] = filename+"_mMid.mov";
                    asset['CDN_mHigh'] = filename+"_mHigh.mov";
                  break;
                  case 'mp4':
                    asset['CDN_Thumb'] = filename+"_Thumb.jpeg";
                    asset['CDN_mLow'] = filename+"_mLow.mp4";
                    asset['CDN_mMid'] = filename+"_mMid.mp4";
                    asset['CDN_mHigh'] = filename+"_mHigh.mp4";
                  break;
                  case 'm4v':
                    asset['CDN_Thumb'] = filename+"_Thumb.jpeg";
                    asset['CDN_mLow'] = filename+"_mLow.mp4";
                    asset['CDN_mMid'] = filename+"_mMid.mp4";
                    asset['CDN_mHigh'] = filename+"_mHigh.mp4";
                  break;
                  case 'zip':
                    asset['CDN_Thumb'] = "";
                    asset['CDN_mLow'] = "";
                    asset['CDN_mMid'] = "";
                    asset['CDN_mHigh'] = filename+".zip";
                  break;
                  case 'pdf':
                    asset['CDN_Thumb'] = "";
                    asset['CDN_mLow'] = "";
                    asset['CDN_mMid'] = "";
                    asset['CDN_mHigh'] = filename+".pdf";
                  break;
                  case 'pptx':
                    asset['CDN_Thumb'] = "";
                    asset['CDN_mLow'] = "";
                    asset['CDN_mMid'] = "";
                    asset['CDN_mHigh'] = filename+".pptx";
                  break;
                }
                
                /* removing old product metadata in asset root */
                //asset = arrayRemove(asset,'collection');
                asset = arrayRemove(asset,'product_name');
                asset = arrayRemove(asset,'full_sku');
                //asset = arrayRemove(asset,'color_name');
                //asset = arrayRemove(asset,'colour_code');
                //asset = arrayRemove(asset,'segmentation');
                asset = arrayRemove(asset,'product_type_asset');
                
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
