import mongoose from "mongoose";
import app from "./app.js";
import './services/cron.service.js'


async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const port = process.env.PORT
    app.listen(port, () => {
        console.log(`Example app listening on port ${port}`)
      }) 
  } catch (error) {
    console.log(error);
  }
}

main();