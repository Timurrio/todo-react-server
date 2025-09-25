import express from "express";
import cors from "cors";
import router from "./routes/index.ts";
import prisma from "./prismaClient.ts";
import errorHandlingMiddleware from "./middleware/ErrorMiddleware.ts";

// const express = require("express");
// const cors = require("cors");
// const router = require("./routes/index");
// const prisma = require("./prismaClient");

const PORT = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", router);
app.use(errorHandlingMiddleware);

const start = async () => {
  try {
    await prisma.$connect();
    app.listen(PORT, () =>
      console.log(`Server running on http://localhost:${PORT}`)
    );
  } catch (e) {
    console.log(e);
  }
};

start();
