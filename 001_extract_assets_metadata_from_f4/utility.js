const AWS = require('aws-sdk');

module.exports = {
    
    sleep: (milliseconds) => {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    },
    
    buildParams: (submoduleId, page, from, fields, publish) => {
        let publishVal;
        
        const date = new Date();
        const today = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' +  (date.getHours()+2) + ':' + date.getMinutes() + ':' + date.getSeconds();
        
        if(from=='' || from === undefined){
            from = '1970-01-01 00:00:00'
        }
            
        if (fields === undefined || fields.length < 1) {
            fields = [];
        }
        
        return {
            'show_deleted':1,
            'filters': [],
            'dates': {
                'from': from,
                'to': today,
                'context': ['asset', 'customFields']
            },
            'submodule_id': submoduleId,
            'page': page,
            'fields': fields
        };
    },
    
    explodeFileName: (filename) => {
        let sku, color_code, asset_type, asset_angle;
        
        let assetKeyArr = filename.split('.'); //explode with main key and resolution
	    let assetCode = assetKeyArr[0]; //main key
        let assetCodeArr = assetCode.split('_'); //explode the main key to read sku, color, type, angle
        
		sku = assetCodeArr[0];
		color_code = assetCodeArr[1];
		
		asset_angle = '';
		asset_type = 'AUTH';
		
		//if it is ALT I read the ALT code removing 'ALT' characters
		if (assetCodeArr[2].indexOf('ALT') >= 0) {
			asset_angle = assetCodeArr[2].split('ALT')[1];
			asset_type = 'ALT';
		}
    			
	    return {
	        'sku': sku, 
	        'color_code': color_code, 
	        'asset_type': asset_type, 
	        'asset_angle': asset_angle
	    };
    },
    stripslashes: (str) => {
        str = str.replace(new RegExp("\\\\", "g"), "");
        return str;
    },
    putObjectToS3v2: async (bucket, key, data) => {
        var s3 = new AWS.S3();
        var params = {
            Bucket : bucket,
            Key : key,
            Body : data
        }
        return s3.putObject(params).promise()    
    },
    putObjectToS3: (bucket, key, data) => {
    var s3 = new AWS.S3();
        var params = {
            Bucket : bucket,
            Key : key,
            Body : data
        }
        s3.putObject(params, function(err, data) {
          if (err) console.log(err, err.stack); // an error occurred
          else     console.log(data);           // successful response
        });
    }
}