const SWAPI = require('./swapi');
const api = new SWAPI();
const express = require('express');
const app = express();

app.set('json spaces', 2)

app.get('/', (req, res) => {
    res.send("Grow Node Exercise App");
});

app.get('/people', async (req, res) =>  {
    const sort = req.query.sortBy;

    if(sort && !['name', 'height', 'mass'].includes(sort)){
        res.status(400);
        res.send(`"${sort}" is not a valid sortBy criteria`)
    }
    else {
        let error = false
        let result;
        let results = []
        let url = 'https://swapi.co/api/people/';
        // NOTE: If the assumption can be made that there will always be 10 per until there are < 10
        // it would be significantly better to call /people/ first, get the count (i.e 87) can
        // calculate how many other pages need to be fetched and make all the calls at the same time.
        // I couldn't see from the docs that there will ALWAYS be 10 per page
        do {
            try{
                result = await api.get({url});
                if(Array.isArray(result.results)) {
                    results = results.concat(result.results)
                }
                url = result.next
            }
            catch(err) {
                error = err
                break;
            }
        } while (result.next)

        if(sort){
            console.debug(`sort by ${sort}`)
            sort === 'name' ?
                results.sort((item, other) => item[sort].localeCompare(other[sort]))
                : results.sort((item, other) => item[sort] - other[sort])
        }

        if(error){
            res.status(404);
            res.send(`<h1>API failed</h1> ${error}`)
        }
        else {
            res.json(results)
        }

    }
});

app.get('/planets', async (req, res) => {

    let url = `https://swapi.co/api/planets/`
    let results = []
    let result;
    let error = false;

    const apiQueue = []

    do {
        try {
            result = await api.get({url});
            if(Array.isArray(result.results)){
                result.results.forEach(planet => {
                    const residentAPICalls = planet.residents.map(url => api.get({url}))
                    apiQueue.push(residentAPICalls)
                    Promise.all(residentAPICalls).then(values => {
                        planet.residents = values.map(resident => resident.name)
                    })
                })
                results = results.concat(result.results)
            }
            url = result.next
        }
        catch(err) {
            error = err
            break;
        }

    }while(result.next)

    if(error){
        res.status(404);
        res.send(`<h1>API failed</h1> ${error}`)
    }
    else {
        Promise.all(apiQueue).then(values => {
            res.json(results)
        }).catch((error) => {
            res.status(404)
            res.send(`could not get resident names`)
        })
    }
});

const server = app.listen(3000, () => {
    console.debug(`app listening on http://${server.address().address !== '::' ? server.address().address : 'localhost'}:${server.address().port}`);
});