// modules
const https = require('https');

module.exports = async (resource,payload) => {
    return new Promise((resolve, reject) => {

        let options = {
            hostname: payload.F4_API_HOSTNAME,
            port: 443,
            path: encodeURI(payload.F4_API_END_POINT + resource),
            method: 'GET',
            headers: {
                authorization: payload.F4_API_KEY
            }
        };
        
        const request = https.get(options, response => {
            
            let body = '';
            response.setEncoding('utf8');
            response.on('data', (chunk) => body += chunk);
            response.on('end', () => resolve(JSON.parse(body)));
            
        });

        request.on('error', (err) => {
            reject(err);
        });
    });
};
