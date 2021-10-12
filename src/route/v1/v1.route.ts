import { Router, NextFunction, Request, Response } from "express";
import PostRouter from "./post.route";

const v1Router = Router();

v1Router.use("/post", PostRouter);

export default v1Router;
