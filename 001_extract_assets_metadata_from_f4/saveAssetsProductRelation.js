
// modules
const sqlString = require('sqlstring');
const f4Api = require('f4Api');
const { buildParams } = require('utility');

module.exports = async (assets, event, mysql) => {

    const sqlAssetProductsHead = 'REPLACE INTO assets_product(asset_id,product_id) VALUES ';
    let sqlAssetProductsValues = '';
    
    const sqlAPDeleteHead = 'DELETE FROM assets_product WHERE ';
    let sqlAPDeleteValues = '';
    
    let assetProductsCall = assets.map(async asset => {
            //delete assets_product relation
            sqlAPDeleteValues += 'asset_id = "'+asset.id+'" OR ';
            
            //insert assets_product relation
            if(asset.press_area_publish=='Yes' && asset.deleted != '1'){
                let linkedProducts = await f4Api('/assets/'+asset.id+'/linkedProducts',event);
                
                if(!linkedProducts['error'] && linkedProducts['linkedProducts'].length > 0){
                    console.log(linkedProducts['linkedProducts']);
                    sqlAssetProductsValues += linkedProducts['linkedProducts'].map(product_id => {
                        return '('+asset.id+','+product_id+')';
                    }).reduce((prev,curr,idx) => {
                        return idx == 0 ? curr : prev + ',' + curr;
                    });
                    sqlAssetProductsValues +=",";
                }
            }
            
    });
    
    const res = await Promise.all(assetProductsCall);
    
    //delete assets_product
    if(sqlAPDeleteValues!=""){
        sqlAPDeleteValues = sqlAPDeleteValues.slice(0, -3)
        const sqlDeletetAP = sqlAPDeleteHead + sqlAPDeleteValues;
        await mysql.query(sqlDeletetAP);
    }
    
    //insert assets_product relation
    if(sqlAssetProductsValues!=""){
        sqlAssetProductsValues = sqlAssetProductsValues.slice(0, -1)
        const sqlInsertAssetProducts = sqlAssetProductsHead + sqlAssetProductsValues;
        await mysql.query(sqlInsertAssetProducts);
    }

};