import "firebase-functions/logger/compat";
import * as functions from "firebase-functions";
import { consum } from "./consum/index.js";
import { mercadona } from "./mercadona/index.js";
import { carrefour } from "./carrefour/index.js";
import { article as articleFunction } from "./api/index.js";

export const mercadonaBot = functions
  .region("europe-west1")
  .runWith({
    secrets: ["DATABASE_URL"],
    timeoutSeconds: 540,
    memory: "512MB",
  })
  .pubsub.schedule("0 */6 * * *")
  .timeZone("Europe/Madrid")
  .onRun(() => mercadona());

export const consumBot = functions
  .region("europe-west1")
  .runWith({
    secrets: ["DATABASE_URL"],
    timeoutSeconds: 540,
    memory: "512MB",
  })
  .pubsub.schedule("0 0/12 * * *")
  .timeZone("Europe/Madrid")
  .onRun(() => consum());

export const carrefourBot = functions
  .region("europe-west1")
  .runWith({
    secrets: ["DATABASE_URL"],
    timeoutSeconds: 540,
    memory: "512MB",
  })
  .pubsub.schedule("0 0/12 * * *")
  .timeZone("Europe/Madrid")
  .onRun(() => carrefour());

export const article = articleFunction;
