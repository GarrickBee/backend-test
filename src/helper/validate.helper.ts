import { validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";
import StatusCode from "http-status-codes";
import { initLogger } from "./logger.helper";
import _ from "lodash";

const logger = initLogger("validate-helper");

/**
 * Main express validator error message return
 * @param req Express Request
 * @param res Express Response
 * @param next Express Next Function
 * @returns
 */
export const errorValidation = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const error = errors.array()[0];
  logger.debug(errors.array());

  return res.status(StatusCode.UNPROCESSABLE_ENTITY).json(errorMsg(`${error.param}: ${error.msg}`));
};

/**
 * Main error message response format
 * @param errorMessage
 * @returns
 */
export const errorMsg = (errorMessage: string): { error: string } => ({
  error: errorMessage,
});

/**
 * Main success message response format
 * @param successMessage
 * @returns
 */
export const successMsg = (successMessage: string): { success: string } => ({
  success: successMessage,
});
