import { app } from "./app.js";
import dotenv from "dotenv";
import { connectDatabase } from "./config/database.js";

dotenv.config();
connectDatabase();

const PORT = process.env.PORT || 4000;

app.listen(PORT, () =>
  console.log(`QR code server is listening at port ${PORT}`)
);
