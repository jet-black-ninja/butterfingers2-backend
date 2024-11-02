import "dotenv/config";
import app from "./app";
import { createServer } from "http";
import { startSocketOneVersusOne } from "./sockets/1v1.socket";
const PORT = process.env.PORT || 5000;

const server = createServer(app);

function startServer() {
  startSocketOneVersusOne(server);
  server.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`.blue);
  });
  const envRequired = ["MONGO_URI", "JWT_SECRET"];
  envRequired.forEach((prop) => {
    if (!process.env[prop]) {
      console.log(`Required environment variable '${prop}' wasn't provided.`);
    }
  });
}
startServer();
