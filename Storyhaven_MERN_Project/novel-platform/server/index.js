import "dotenv/config";
import connectDatabase from "./config/database.js";
import createApp from "./app.js";

await connectDatabase();

const app = createApp();
app.listen(process.env.PORT || 5000, () =>
  console.log("Storyhaven API running"),
);
