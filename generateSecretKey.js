const fs = require('fs');
const crypto = require('crypto');

const generateRandomKey = () => {
  return crypto.randomBytes(32).toString('hex'); 
};

const secretKey = generateRandomKey();

fs.writeFileSync('.env', `JWT_SECRET=${secretKey}\n`, { flag: 'a' });

console.log('Secret key generated and synced to .env file.');
