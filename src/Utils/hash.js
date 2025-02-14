const bcrypt = require('bcrypt');

async function hash(password) {
    const saltRounds = 10; 
    const salt = await bcrypt.genSalt(saltRounds);
    return await bcrypt.hash(password, salt);
}
async function compare(password,hash){
    return await bcrypt.compare(password, hash);
}

module.exports = {
    hash,
    compare
}