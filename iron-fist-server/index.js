const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// connections

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@iron-fist.ryngjnb.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // try ar vitorei sob api related code lekte hobe mongodb connection ar jonno

    /* ---------------------
        homepage related route
        -------------------------*/
      
    //   all the collections 
      
    await client.connect();
    const classesCollection = client
      .db("iron-fist")
      .collection("popular-classes");

    //   popular-classes
    //  collection ar maddome datagula classesCollection ar vitore age thekei nia asselam r .get /classes ar maddome amra data gula amadar localhost a show krtese 
      
      app.get('/classes',async(req, res) => {
        const result = await classesCollection.find().toArray();
      res.send(result);
    });

    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("iron fist is running");
});

app.listen(port, () => {
  console.log(`Iron Fist running on Port ${port}`);
});
