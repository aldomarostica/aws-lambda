
// modules
const mysql = require('mysql');

// vars
/*
const hostname = process.env.RDS_HOSTNAME;
const username = process.env.RDS_USERNAME;
const password = process.env.RDS_PASSWORD;
const database = process.env.RDS_DATABASE;
const port     = process.env.RDS_PORT;*/

module.exports = async (query,event) => {
    return new Promise((resolve, reject) => {

        const connection = mysql.createConnection({
            host     : event.RDS_HOSTNAME,
            user     : event.RDS_USERNAME,
            password : event.RDS_PASSWORD,
            database : event.RDS_DATABASE,
            port     : event.RDS_PORT
        });

        connection.connect((err) => !err || reject(err));

        connection.query(query, (error, results, fields) => {
            connection.end();
            if (error) {
                return reject(error);
            }

            resolve(results);
        });
        
        
    });
};
