process.on("uncaughtException", function (err) {
  console.error("uncaughtException: %o", err);
});
import "module-alias/register";
import ServerConfig from "./config/server.config";
import express from "express";
import errorhandler from "errorhandler";
import cors from "cors";
import MainRouter from "./route/main.route";
import path from "path";
import compression from "compression";
import cookieParser from "cookie-parser";
import { requestLogMiddleWare } from "./helper/logger.helper";

// Global path
const app = express();
// Enable CORS
app.use(cors());

// Compress all request
app.use(compression());

// Request Body
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Request Log
app.use(requestLogMiddleWare());

// Cookie
app.use(cookieParser());

// Set Public Folder
app.use(express.static(path.join(__dirname, "public")));

// CORS
app.use(cors());

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(errorhandler());

// Router
app.use(MainRouter);

/// catch 404 and forward to error handler
app.use(function (req, res, next) {
  const err = new Error("Not Found");
  res.status(404);
  next(err);
});

// development error handler
// will print stacktrace
if (ServerConfig.isDevelopment()) {
  app.use(function (
    err: { stack: any; status: any; message: any },
    req: any,
    res: {
      status: (arg0: any) => void;
      json: (arg0: { errors: { message: any; error: any } }) => void;
    },
    next: any
  ) {
    console.log(err.stack);

    res.status(err.status || 500);

    res.json({
      errors: {
        message: err.message,
        error: err,
      },
    });
  });
}

// production error handler
// no stacktrace leaked to user
app.use(function (
  err: { status: any; message: any },
  req: any,
  res: {
    status: (arg0: any) => void;
    json: (arg0: { errors: { message: any; error: {} } }) => void;
  },
  next: any
) {
  res.status(err.status || 500);
  res.json({
    errors: {
      message: err.message,
      error: {},
    },
  });
});

// Start Server
const serverPort = 4000;

app.listen(serverPort, function () {
  console.log("Listening on port " + serverPort);
});
