import { consum } from "./consum/index.js";
import { mercadona } from "./mercadona/index.js";

(async function main() {
  await consum();
  await mercadona();
})();
