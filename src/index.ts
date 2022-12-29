import * as functions from "firebase-functions";
import { mercadona } from "./mercadona/index.js";

export const scheduledFunction = functions
  .region("europe-west1")
  .runWith({
    memory: "512MB",
  })
  .pubsub.schedule("0 0 * * *")
  .timeZone("Europe/Madrid")
  .onRun(() => mercadona());
