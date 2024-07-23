
const axios = require('axios');

async function getToken() {
    try {
        const response = await axios.post('https://api.vendemmia.com.br/login/check', {
            "username": "a5b223e8cbe5c942aa452b9882bb6bd8256f6a79",
            "password": process.env.TOKENVANDEMMIA
        }, {
            headers: { accept: 'application/json', 'content-type': 'application/json' }
        });
        return response.data;
    } catch (error) {
        return error.response.data.erro;
    }
}

async function tokenValid() {
    const token = await getToken()
    try {
        const response = await axios.post('https://api.vendemmia.com.br/pickingepacking/metrics/picking?type_storage=picking',{
            headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'Authorization': `bearer ${token.token}`,
            }
        });
        return response.data;
    } catch (error) {
        return error.response.data.erro;
    }
}


module.exports = getToken