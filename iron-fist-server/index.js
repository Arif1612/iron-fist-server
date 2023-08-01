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
        homepage related api
        -------------------------*/

    //   all the collections

    await client.connect();
    const classesCollection = client
      .db("iron-fist")
      .collection("popular-classes");
    const usersCollection = client.db("iron-fist").collection("users");
    const instructionCollection = client
      .db("iron-fist")
      .collection("instructors");
    const studentCollection = client
      .db("iron-fist")
      .collection("student-achievements");

    const studentCartCollection = client
      .db("iron-fist")
      .collection("student-carts");

    //  collection ar maddome datagula classesCollection ar vitore age thekei nia asselam r .get /classes ar maddome amra data gula amadar localhost a show krtese

    /************
     * users related API
     **************** */

    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);

      if (existingUser) {
        //console.log(existingUser);
        return res.send({ message: "user already exists" });
      }

      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    /***************
     * student-cart-collection
     *************** */

    app.post("/student-carts", async (req, res) => {
      const item = req.body;
      // console.log(item);
      const result = await studentCartCollection.insertOne(item);
      res.send(result);
    });

    app.get("/student-carts", async (req, res) => {
      const email = req.query.email;
      // console.log(email);
      if (!email) {
        res.send([]);
      }
      const query = { email: email };
      const result = await studentCartCollection.find(query).toArray();
      // console.log(result);
      res.send(result);
    });

    /***************
     *   popular-classes related API
     * ********** */
    app.get("/classes", async (req, res) => {
      const result = await classesCollection.find().toArray();
      res.send(result);
    });
    app.get("/instructors", async (req, res) => {
      const result = await instructionCollection.find().toArray();
      res.send(result);
    });
    app.get("/students", async (req, res) => {
      const result = await studentCollection.find().toArray();
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
