const express = require('express'),
      axios   = require('axios'),
      memoize = require('lodash.memoize'),
      app     = express(),
      port    = 3005;

const sortByNumber = (arr, query) => {
  arr.sort((a, b) => {  
    return (Number(a[query].replace(/,/g, '')) || Infinity) - (Number(b[query].replace(/,/g, '')) || Infinity);
  });
}

const sortByName = arr => {
  arr.sort((a, b) => {
    if(a.name < b.name) return -1;
    if(a.name > b.name) return 1;
    return 0;
  });
}

const getAllResources = memoize(async url => {
  let resources = [];
  let response;
  do {
    response = await axios.get(url);
    resources.push(...response.data.results);
    url = response.data.next;
  } while(response.data.next);
  return resources;
})


const getAllPlanetResidents = memoize(async planet => {
  if(planet.residents.length) {
    let promises = planet.residents.map(async url => {
      let resident = await axios.get(url)
      return resident.data.name;
    })
    planet.residents = await Promise.all(promises);
  }
  return planet; 
})

app.get('/people', async (req, res) => {
  try {
    let people = await getAllResources('https://swapi.co/api/people/?page=1');
    if(req.query.sortBy) {
      if(req.query.sortBy === 'name') {
        sortByName(people)
      } else {
        sortByNumber(people, req.query.sortBy)
      } 
    }
    res.status(200).send(people);
  } catch(err) {
    console.error(err);
  }
})

app.get('/planets', async (req, res) => {
  try {
    let planets = await getAllResources('https://swapi.co/api/planets/?page=1');
    let promises = planets.map(planet => getAllPlanetResidents(planet))
    let planetsWithResidents = await Promise.all(promises)
    res.status(200).send(planetsWithResidents);
  } catch(err) {
    console.error(err);
  }
})

app.listen(port, () => console.log(`listening on port::${port}`));