const express = require("express");
const fetch = require("node-fetch");
const redis = require('redis');

const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.env.PORT || 6379;

const client = redis.createClient(REDIS_PORT);

const app = express(); 

async function getRepos(req, res, next){
    try {
        console.log('Fetching data...');
        const { username } = req.params;
        
        const response = await fetch(`https://api.github.com/users/${username}`);
        
        const data = await response.json();
        
        const repos = data.public_repos;
        //Set data to Redis
        client.setex(username, 60, repos);
        
        return res.send(
            `<h2>${username} has ${repos} GitHub repos</h2>`
        );
    } catch (error) {
        console.error('error');
        return res.status(500);
    }
}

// Cache middleware
function cache(req, res, next){
    const { username } = req.params;
    client.get(username, (err, data) => {
        if(err) throw err;
        if(data != null){
            return res.send(
                `<h2>${username} has ${data} GitHub repos</h2>`
            );
        }else{
            next();
        }
    })
}


app.get('/repos/:username', cache, getRepos);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} 🔥`);
})
