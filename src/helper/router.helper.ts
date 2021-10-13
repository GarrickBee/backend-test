import express from "express";
// export a wrapper that catches errors and passes it to next(),
// so we can write cleaner code
export function wrapAsync(fn: any) {
  return function (req: express.Request, res: express.Response, next: express.NextFunction) {
    // Make sure to `.catch()` any errors and pass them along to the `next()`
    // middleware in the chain, in this case the error handler.
    fn(req, res, next).catch(next);
  };
}
