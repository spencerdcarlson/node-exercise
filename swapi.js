const https = require('https');
const mock = require('./get-people-result')

class SWAPI {

    get({url = ''} = {}) {
        return new Promise((resolve, reject) => {
            // resolve(mock)

            const request = https.get(url, (res) => {
                let stream = ''
                res.on('data', (data) => stream += data);
                res.on('end', () => {
                    // console.debug(`END HTTP code: ${res.statusCode}`)
                    res.statusCode === 200 ? resolve(JSON.parse(stream)) : reject(stream)
                })
            });

            request.on('error', (e) => {
                // console.debug(`request error code: ${res.statusCode}`)
                reject(e)
            })


        })
    }


}


module.exports = SWAPI