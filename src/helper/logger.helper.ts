import ServerConfig from "@src/config/server.config";
import _ from "lodash";
import winston, { format } from "winston";
import expressWinston, { ExpressWinstonRequest } from "express-winston";

/**
 * Local console log format
 * @param param0 winston.Logform.TransformableInfo
 * @returns
 */
function localLogPrintFormat({
  message,
  level,
  tag,
  subTag,
  ...optionArgs
}: winston.Logform.TransformableInfo) {
  if (_.isObject(message)) {
    message = JSON.stringify(message, null, 2);
  }

  let logString = `${level} [${tag}] ${subTag ? `(${subTag})` : ""}: ${message} `;

  if (!_.isEmpty(optionArgs)) {
    logString += `${JSON.stringify(optionArgs, null, 2)}`;
    return logString;
  }

  return logString;
}

/**
 * Custom Dynamic Meta Request Log
 * @param req Express Winston Request
 * @param res Express Winston Filter Response
 * @returns
 */
function customRequestDynamicMeta(req: ExpressWinstonRequest, res: expressWinston.FilterResponse) {
  const httpRequest: any = {};
  const meta: any = {};
  if (req) {
    meta.httpRequest = httpRequest;
    httpRequest.requestMethod = req.method;
    httpRequest.requestUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    httpRequest.protocol = `HTTP/${req.httpVersion}`;
    httpRequest.remoteRawIp = req.ip; // this includes both ipv6 and ipv4 addresses separated by ':'
    httpRequest.remoteIp =
      req.ip.indexOf(":") >= 0 ? req.ip.substring(req.ip.lastIndexOf(":") + 1) : req.ip; // just ipv4
    httpRequest.requestSize = req.socket.bytesRead;
    httpRequest.userAgent = req.get("User-Agent");
    httpRequest.referrer = req.get("Referrer");
  }

  if (res) {
    meta.httpRequest = httpRequest;
    httpRequest.status = res.statusCode;
    httpRequest.latency = {
      seconds: Math.floor(res.responseTime / 1000),
      nanos: (res.responseTime % 1000) * 1000000,
    };
    if (res.body) {
      if (typeof res.body === "object") {
        httpRequest.responseSize = JSON.stringify(res.body).length;
      } else if (typeof res.body === "string") {
        httpRequest.responseSize = res.body.length;
      }
    }
  }

  return meta;
}

/**
 * * Main logging function
 * At local we will log message in string format
 * @param tag String tag to help identify where the log is from eg. "life-policy-route"
 * @returns winston.Logger
 */
export function initLogger(tag: string, extraTags?: Object): winston.Logger {
  if (!ServerConfig.isLocal()) {
    return winston.createLogger({
      level: "info", // For non-local env, debug level log will not be store
      defaultMeta: { tag: tag, ...extraTags },
      format: format.combine(
        format((info, opts) => {
          // Google cloud take severity as level and uppercase format
          info["severity"] = info.level.toUpperCase();
          delete info.level;
          return info;
        })(),
        format.json()
      ),
      transports: [new winston.transports.Console()],
      exitOnError: false,
    });
  }

  return winston.createLogger({
    level: "debug",
    defaultMeta: { tag: tag, ...extraTags },
    transports: [
      new winston.transports.Console({
        format: format.combine(
          format.colorize(),
          format.splat(),
          format.simple(),
          format.printf(localLogPrintFormat)
        ),
      }),
    ],
    exitOnError: false,
  });
}

/**
 * Main request and response logging function
 * @returns  expressWinston.logger
 */
export function requestLogMiddleWare() {
  // * Log Request and Request Body
  expressWinston.requestWhitelist.push("body");

  // * Default blacklist body field
  expressWinston.bodyBlacklist.push("oldPassword", "newPassword", "repeatPassword", "password");

  // Server side logging
  if (!ServerConfig.isLocal()) {
    return expressWinston.logger({
      baseMeta: { tag: "http" },
      transports: [new winston.transports.Console()],
      format: winston.format.json(),
      meta: true, // optional: control whether you want to log the meta data about the request (default to true)
      msg: "HTTP {{req.method}} {{req.url}}", // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
      expressFormat: true, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
      colorize: false, // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
      dynamicMeta: customRequestDynamicMeta,
    });
  }

  // local logging
  return expressWinston.logger({
    baseMeta: { tag: "http" },
    requestWhitelist: ["url", "method", "originalUrl", "query"],
    transports: [
      new winston.transports.Console({
        format: format.combine(
          format.colorize(),
          format.splat(),
          format.simple(),
          format.printf(localLogPrintFormat)
        ),
      }),
    ],
    meta: true, // optional: control whether you want to log the meta data about the request (default to true)
    msg: "HTTP {{req.method}} {{req.url}}", // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
    expressFormat: true, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
    colorize: true, // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
    dynamicMeta: customRequestDynamicMeta,
  });
}

/**
 * Error request log middleware
 * This is not in use for now, will decide whether we should log this in future
 * TODO(garrick) : Decide if we need to go with this
 * @returns
 */
export function errorRequestLogMiddleWare() {
  // * Log Request and Request Body
  expressWinston.requestWhitelist.push("body");

  // * Default blacklist body field
  expressWinston.bodyBlacklist.push("oldPassword", "newPassword", "repeatPassword", "password");

  // Server side logging
  if (!ServerConfig.isLocal()) {
    return expressWinston.errorLogger({
      baseMeta: { tag: "http" },
      transports: [new winston.transports.Console()],
      format: winston.format.json(),
      meta: true, // optional: control whether you want to log the meta data about the request (default to true)
      msg: "HTTP {{req.method}} {{req.url}}", // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
      dynamicMeta: customRequestDynamicMeta,
    });
  }

  return expressWinston.errorLogger({
    level: "warn",
    baseMeta: { tag: "http-error" },
    requestWhitelist: ["url", "method", "originalUrl", "query"],
    transports: [
      new winston.transports.Console({
        format: format.combine(
          format.colorize(),
          format.splat(),
          format.simple(),
          format.printf(localLogPrintFormat)
        ),
      }),
    ],
    meta: true, // optional: control whether you want to log the meta data about the request (default to true)
    msg: "HTTP {{req.method}} {{req.url}}", // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
    dynamicMeta: customRequestDynamicMeta,
  });
}

/**
 * Sub tag format for logger
 * @param subTag Sub tag id
 * @param args Args
 * @returns
 */
export const subTag = (
  subTag: string,
  args?: Object
): Readonly<{ subTag: string } & { [arg: string]: any }> => {
  return { subTag, ...args };
};
