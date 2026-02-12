const { Client } = require('pg');
require('dotenv').config({ path: '.env' });

async function testConnection() {
    console.log('Testing connection to:', process.env.DATABASE_URL.replace(/:[^:]*@/, ':****@'));
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL.includes('sslmode=require') ? { rejectUnauthorized: false } : false
    });

    try {
        await client.connect();
        console.log('Connection successful!');
        const res = await client.query('SELECT NOW()');
        console.log('Server time:', res.rows[0]);
        await client.end();
    } catch (err) {
        console.error('Connection error:', err);
    }
}

testConnection();
