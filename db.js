const MongoClient = require('mongodb').MongoClient;
const querystring = require('querystring');

// Define the MongoDB URL and database name
const url = 'mongodb://127.0.0.1:27017';

// define database name
const dbName = 'nodefetch';

//define collection name
const collectionName = 'album';


//Function to create database and collection
async function createDB() {
  let result;
  try {
    const client = await MongoClient.connect(url);
    const db = client.db(dbName);
    console.log(`Database ${db.databaseName} is ready`);
    const collections = await db.collections();
    const collectionExists = collections.some(
      (collection) => collection.collectionName === collectionName
    );

    if (!collectionExists) {
      await db.createCollection(collectionName);
      console.log(`Collection ${collectionName} created`);
    } else {
      console.log(`Collection ${collectionName} already exists`);
    }
    result = true;
    client.close();
  } catch (error) {
    console.error(error);
    result = false;
  }

  return result;
}

// Define a function that inserts a document into the database
async function insertDocument(document) {
  const client = await MongoClient.connect(url);
  const db = client.db(dbName);
  const collection = db.collection(collectionName);
  const result = await collection.insertOne(document);
  client.close();
  return result;
}

// Define a function that check if a document exist
async function documentExists(query) {
  const client = await MongoClient.connect(url);
  const db = client.db(dbName);
  const collection = db.collection(collectionName);
  const result = await collection.findOne(query);
  client.close();
  return !!result;
}


// Define a function that fetch paginated data from db 
async function fetchData(req) {
  try {
    const client = await MongoClient.connect(url);

    const collection = client.db(dbName).collection(collectionName);

    // parse the query string
    const query = querystring.parse(req.url.split('?')[1]);
    const page = parseInt(query.page) || 1;
    const skip = (page - 1) * 10;
    const totalCount = await collection.countDocuments();
    const totalPages = Math.ceil(totalCount / 10);
    const results = await collection.find().skip(skip).limit(10).sort({ id: -1 }).toArray();

    const prevUrl = page > 1 ? `http://${req.headers.host}${req.url.split('?')[0]}?page=${page - 1}` : `http://${req.headers.host}${req.url.split('?')[0]}`;
    const nextUrl = page < totalPages ? `http://${req.headers.host}${req.url.split('?')[0]}?page=${page + 1}` : null;

    // construct the response object
    const response = {
      results: results,
      pagination: {
        totalResults: totalCount,
        totalPages: totalPages,
        currentPage: page,
        prevUrl: prevUrl,
        nextUrl: nextUrl
      }
    };
    await client.close();
    return response;
  } catch (error) {
    console.error(error);
  } 
}


// Export the functions for use in other files
module.exports = {
  createDB,
  insertDocument,
  documentExists,
  fetchData,
};
