import { wrapAsync } from "@src/helper/router.helper";
import PostService from "@src/service/post.service";
import { Router, NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { query } from "express-validator";
import { IComment } from "@src/type/post.type";
import _ from "lodash";
import { errorMsg, errorValidation } from "@src/helper/validate.helper";
// Base Routes /category
const PostRouter = Router();

// Get Category
PostRouter.get(
  "/all-ordered-by-top-comment",
  wrapAsync(async (req: Request, res: Response) => {
    const posts = await PostService.getAllPostOrderedByNoOfComments();

    const response = posts.map((post) => {
      return {
        post_id: post.id,
        post_title: post.title,
        post_body: post.body,
        total_number_of_comments: post.totalComment,
      };
    });

    return res.status(StatusCodes.OK).json(response);
  })
);

PostRouter.get(
  "/comment/search",
  [
    query("postId").optional().isNumeric(),
    query("id").optional().isNumeric(),
    query("name").optional().isString(),
    query("email").optional().isEmail().toLowerCase(),
    query("body").optional().isString(),
  ],
  errorValidation,
  wrapAsync(async (req: Request, res: Response) => {
    const reqQuery: {
      postId?: number;
      id?: number;
      name?: string;
      email?: string;
      body?: string;
    } = req.query;

    // Return empty array if there isn't any query param
    if (
      _.isEmpty(reqQuery.postId) &&
      _.isEmpty(reqQuery.id) &&
      _.isEmpty(reqQuery.name) &&
      _.isEmpty(reqQuery.email) &&
      _.isEmpty(reqQuery.body)
    ) {
      return res.status(StatusCodes.OK).json([]);
    }

    let comments = await PostService.getAllComments();
    if (_.isEmpty(comments)) {
      return res.status(StatusCodes.NOT_FOUND).json(errorMsg("Comments not found"));
    }

    // Query Filter
    if (reqQuery.postId) {
      comments = comments.filter((comment) => comment.postId == reqQuery.postId);
    }
    if (reqQuery.id) {
      comments = comments.filter((comment) => comment.id == reqQuery.id);
    }
    if (reqQuery.name) {
      comments = comments.filter((comment) => comment.name.includes(reqQuery.name));
    }
    if (reqQuery.email) {
      comments = comments.filter((comment) => comment.email == reqQuery.email);
    }
    if (reqQuery.body) {
      comments = comments.filter((comment) => comment.body.includes(reqQuery.body));
    }

    return res.status(StatusCodes.OK).json(comments);
  })
);

export default PostRouter;
