import { Router, NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import v1Router from "./v1/v1.route";

const MainRouter = Router();

MainRouter.use("/v1", v1Router);

export default MainRouter;
