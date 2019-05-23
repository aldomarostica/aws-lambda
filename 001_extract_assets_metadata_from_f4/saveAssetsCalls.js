
// modules
const sqlString = require('sqlstring');
const f4Api = require('f4Api');
const { buildParams } = require('utility');

module.exports = async (fields, event, mysql) => {

    const f4Config = await f4Api('/assets/config',event);
    
    const pageSize = f4Config.pageSize;
    let submodulesId = f4Config.submodules.map(submodule => submodule.id);
    
    const sqlFrom = "SELECT value FROM lambda_var where var='job_start_date'";
    let from = await mysql.query(sqlFrom);
    from = from[0].value;
    
    const cfgCalls = submodulesId
        .map((submoduleId) => {
            let params = buildParams(submoduleId, 0, from);
            return f4Api('/assets?pars=' + JSON.stringify(params),event);
        });
    
    let submodules = await Promise.all(cfgCalls);
    
    //clean submodules and submodulesId
    let toRemove = []
    submodules.map((submodule,index) => {
        if(submodule.hasOwnProperty('error')){
            toRemove.push(index);
        }
    });
    
    submodules = submodules.filter(( el, index ) => {
        return toRemove.indexOf(index) < 0;
    }).map(item => item);

    submodulesId = submodulesId.filter(( el, index ) => {
        return toRemove.indexOf(index) < 0;
    }).map(item => item);
    
    let sqlHead = 'REPLACE INTO assets_call (url,submodule_id,page,fields) VALUES ';
    let sqlValues = submodules
        .map((submodule, index) => {
            
            const pages = Array.from(Array(Math.ceil(submodule.total / pageSize)).keys());
            
            const submoduleCalls = pages.map((page) => {
                let params;
                
                if (fields.length > 0) {
                    params = buildParams(submodulesId[index], page, from, fields);
                } else {
                    params = buildParams(submodulesId[index], page, from);
                }
                const fieldsString = fields.join(',');
                
                return '("/assets?pars='+ sqlString.escape(JSON.stringify(params)) +'",'+submodulesId[index]+','+page+',"'+fieldsString+'")';
                
            });
            
            return submoduleCalls;
            
        }).reduce((prev,curr,idx) => {
             return idx == 0 ? curr : prev + ',' + curr;
        });
        
    const sqlInsert = sqlHead + sqlValues;
    
    const resultset = await mysql.query(sqlInsert);
    
    await mysql.end();
    
    return resultset;

};