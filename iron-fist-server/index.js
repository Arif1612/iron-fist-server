const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
var jwt = require("jsonwebtoken");

const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY);
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "unauthorized access" });
  }
  // bearer token
  const token = authorization.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .send({ error: true, message: "unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
};

// connections

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
    const paymentCollection = client.db("iron-fist").collection("payments");

    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "6h",
      });
      res.send({ token });
    });

    // warning: use verifyJWT before using verify Admin

    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      if (user?.role !== "admin") {
        return res
          .status(403)
          .send({ error: true, message: "forbidden message" });
      }
      next();
    };

    //
    const verifyInstructor = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      if (user?.role !== "instructor") {
        return res
          .status(403)
          .send({ error: true, message: "forbidden message" });
      }
      next();
    };

    //  collection ar maddome datagula classesCollection ar vitore age thekei nia asselam r .get /classes ar maddome amra data gula amadar localhost a show krtese

    /************
     * users related API
     **************** */

    app.get("/users", verifyJWT, verifyAdmin, async (req, res) => {
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

    // security check get admin
    app.get("/users/admin/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;

      if (req.decoded.email !== email) {
        res.send({ admin: false });
      }
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const result = { admin: user?.role === "admin" };
      res.send(result);
    });

    // security check get instructor

    app.get("/users/instructor/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;

      if (req.decoded.email !== email) {
        res.send({ admin: false });
      }
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const result = { instructor: user?.role === "instructor" };
      res.send(result);
    });

    // security patch admin
    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.delete("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });

    /***************
     * student-cart-collection
     *************** */

    // get verifyJWT agula pore add krse

    app.get("/student-carts", async (req, res) => {
      const email = req.query.email;
      // console.log(email);
      if (!email) {
        res.send([]);
      }

      const decodedEmail = req.query.email;
      if (email !== decodedEmail) {
        return res
          .status(403)
          .send({ error: true, message: "forbidden access" });
      }

      const query = { email: email };
      const result = await studentCartCollection.find(query).toArray();
      // console.log(result);
      res.send(result);
    });

    // enrolled classes specific students
    app.get("/payments", async (req, res) => {
      const email = req.query.email;
      // console.log(email);
      if (!email) {
        res.send([]);
      }

      const decodedEmail = req.query.email;
      if (email !== decodedEmail) {
        return res
          .status(403)
          .send({ error: true, message: "forbidden access" });
      }

      const query = { email: email };
      const result = await paymentCollection.find(query).toArray();
      // console.log(result);
      res.send(result);
    });

    // post
    app.post("/student-carts", async (req, res) => {
      const item = req.body;
      // console.log(item);

      const query = { classId: item.classId, email: item.email };

      const existingClass = await studentCartCollection.findOne(query);

      if (existingClass) {
        //console.log(existingUser);
        return res.send({ message: "user already add this class" });
      }

      const result = await studentCartCollection.insertOne(item);
      res.send(result);
    });

    // delete
    app.delete("/student-carts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await studentCartCollection.deleteOne(query);
      res.send(result);
    });

    /***************
     *   popular-classes related API
     * ********** */
    app.get("/classes", async (req, res) => {
      const result = await classesCollection.find().toArray();
      res.send(result);
    });

    app.post("/classes", verifyJWT, verifyInstructor, async (req, res) => {
      const newClass = req.body;
      const result = await classesCollection.insertOne(newClass);
      res.send(result);
    });

    app.delete("/classes/:id", verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await classesCollection.deleteOne(query);
      res.send(result);
    });

    // update
    app.patch("/classes/:id/update-seats", verifyJWT, async (req, res) => {
      const classId = req.params.id;
      const query = { _id: new ObjectId(classId) };

      // Assuming the class document has an "availableSeats" field
      const classInfo = await classesCollection.findOne(query);

      if (!classInfo) {
        return res.status(404).send({ message: "Class not found." });
      }

      // Check if there are available seats to reduce
      if (classInfo.availableSeats <= 0) {
        return res
          .status(400)
          .send({ message: "No available seats to reduce." });
      }

      // Update the available seats and reduce by 1
      const newAvailableSeats = classInfo.availableSeats - 1;

      // Update the class document with the new available seats value
      const updateResult = await classesCollection.updateOne(query, {
        $set: { availableSeats: newAvailableSeats },
      });

      if (updateResult.modifiedCount !== 1) {
        return res
          .status(500)
          .send({ message: "Failed to update available seats." });
      }

      res.send({
        message: "Available seats reduced successfully.",
        newAvailableSeats,
      });
    });

    // CREATE PAYMENT INTENT

    app.post("/create-payment-intent", verifyJWT, async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    // payment related api
    app.post("/payments", verifyJWT, async (req, res) => {
      const payment = req.body;
      const enrollClasses = payment.studentCarts;
      console.log(enrollClasses);
      console.log(payment);
      const insertResult = await paymentCollection.insertOne(payment);
      console.log(insertResult);
      const query = {
        _id: { $in: payment.cartItems.map((id) => new ObjectId(id)) },
      };
      const deleteResult = await studentCartCollection.deleteMany(query);

      res.send({ insertResult, deleteResult });
    });
    // payment related end

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
