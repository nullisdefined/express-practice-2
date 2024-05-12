const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: '127.0.0.1',  
    user: 'root',
    password: 'root',
    database: 'user_management',
    connectionLimit: 10,
});

module.exports = pool;