const express = require("express");
import { MongoClient, Db, Collection } from "mongodb";

const {
  checkRequiredPermissions,
  validateAccessToken,
} = require("../middleware/auth0");

const profileRouter = express.Router();

/*
  (req: any, res: {
  json(docs: import("mongodb").WithId<import("bson").Document>[]): unknown; status: (arg0: number) => {
  send(arg0: string): unknown; (): any; new(): any; json: { (arg0: string): void; new(): any; }; 
}; 
})  
*/
profileRouter.post("/", validateAccessToken, async (req: any, res: any) => {
  const userID = req.body.UserID;
  const mongoURI = process.env.MONGO_URL || "";

  console.log(req.body.UserID);

  try {
    const client = await MongoClient.connect(mongoURI);
    const db: Db = client.db("Ice");
    const collection: Collection = db.collection("Users");

    const regexQuery = new RegExp(userID);
    //const user = await collection.findOne({ playerID: { $regex: regexQuery } });

    const user = await collection.find({ playerID: userID }).toArray();

    if (user.length == 0) {
      const result = await collection.insertOne({
        name: "",
        description: "",
        country: "",
        games: [],
        profilePictureUrl: "",
        playerID: userID,
      });

      const getInputedData = await collection
        .find({ playerID: userID })
        .toArray();

      res.status(200).json(getInputedData[0]);
    } else if (user.length == 1) {
      res.status(200).json(user[0]);
    } else {
      res.status(500).send("Multiple Documents with same ID");
    }

    client.close(); // Schließe die Verbindung zur Datenbank
  } catch (err) {
    console.error("Fehler beim Ausführen der Abfrage:", err);
    res.status(500).send("Interner Serverfehler");
  }
});

profileRouter.post(
  "/update",
  validateAccessToken,
  async (req: any, res: any) => {
    const userID = req.body.UserID;
    const mongoURI = process.env.MONGO_URL || "";

    try {
      const client = await MongoClient.connect(mongoURI);
      const db: Db = client.db("Ice");
      const collection: Collection = db.collection("Users");

      const result = await collection.find({ playerID: userID }).toArray();

      if (result.length > 1) {
        console.log("There are multiple users with the ID: ", userID);
        res.status(500).send("Multiple Documents with same ID");
        client.close();
        return;
      }

      const user = await collection.updateOne(
        { playerID: userID },
        {
          $set: {
            name: req.body.Name,
            description: req.body.Description,
            country: req.body.Country,
          },
        }
      );

      if (user.modifiedCount == 1) {
        res.status(200).json({});
      } else if (user.modifiedCount == 0) {
        console.log(user, " ", userID, " ", result);
        res.status(500).send("No User with that ID");
      } else {
        //res.status(500).send("Multiple Documents with same ID");
      }

      client.close(); // Schließe die Verbindung zur Datenbank
    } catch (err) {
      console.error("Fehler beim Ausführen der Abfrage:", err);
      res.status(500).send("Interner Serverfehler");
    }
  }
);

export { profileRouter };
