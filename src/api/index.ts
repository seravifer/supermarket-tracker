import * as functions from "firebase-functions";
import { db } from "../db.js";

export const article = functions.https.onRequest(async (req, res) => {
  const companyId = req.query.id as string;
  const company = req.query.company as string;
  console.log("id", companyId);
  if (!companyId || !company) {
    res.status(400).send("Missing params");
    return;
  }
  const article = await db.product.findFirst({
    where: {
      companyId,
      //company,
    },
    include: {
      histories: true,
    },
  });
  console.log("article", article);
  if (!article) {
    res.status(404).send("Article not found");
    return;
  }
  res.json(article);
});
