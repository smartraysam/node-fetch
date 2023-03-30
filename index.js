const http = require('http');
const db = require('./db.js');
const axios = require('axios');

const PORT = process.env.PORT || 3000;
var dataurl = 'https://jsonplaceholder.typicode.com/photos';

const server = http.createServer(async (req, res) => {
  //set the request route
  if (req.url.startsWith('/api/getdata') && req.method === 'GET') {
    const response = await db.fetchData(req);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Server is running, route not found' }));
  }
});

const fetchDataUrl = () => {
  axios
    .get(dataurl)
    .then(async (res) => {
      var data = res.data;

      data.forEach(async (element) => {
        const query = { id: element.id };
        const exists = await db.documentExists(query);
        if (exists) {
          console.log('data exist');
        } else {
          await db.insertDocument(element);
          console.log('new insert');
        }
      });
    })
    .catch((err) => {
      console.log('Error: ', err.message);
    });
};

const setupDB = async (dbname) => {
  const result = await db.createDB(dbname);
  return result;
};

server.listen(PORT, () => {
  console.log(`server started on port: ${PORT}`);
  //start db setup
  const dbres = setupDB();
  if (!dbres) {
    console.log('db setup fails');
    return;
  }
  //first time call on start
  fetchDataUrl();
  //call every 1 minutes.
  setInterval(fetchDataUrl, 60000);
});
