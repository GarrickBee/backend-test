import { Router, NextFunction, Request, Response } from "express";
import v1Router from "./v1/v1.route";

const MainRouter = Router();

MainRouter.use("/v1", v1Router);

MainRouter.use("/", function (err: any, req: Request, res: Response, next: NextFunction) {
  if (err.name === "ValidationError") {
    return res.status(422).json({
      errors: Object.keys(err.errors).reduce(function (errors: any, key) {
        errors[key] = err.errors[key].message;

        return errors;
      }, {}),
    });
  }
  return next(err);
});

export default MainRouter;
