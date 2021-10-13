import { IComment, IPost } from "@src/type/post.type";
import axios from "axios";
import _ from "lodash";
import NodeCache from "node-cache";

const postServiceCache = new NodeCache({ stdTTL: 100, checkperiod: 120 });

namespace PostService {
  // Get all post ordered by no of comments
  export async function getAllPostOrderedByNoOfComments(): Promise<
    (IPost & { totalComment: number })[]
  > {
    const allComments = await getAllComments();
    // Calculate number comment per post
    const commentPerPost: { [postId: number]: number } = {};
    for (const comment of allComments) {
      commentPerPost[comment.postId] = commentPerPost[comment.postId]
        ? commentPerPost[comment.postId] + 1
        : 1;
    }

    // Insert total number of comment
    const allPosts = await getAllPosts();
    const postsWithTotalComment = allPosts.map((post) => {
      return {
        ...post,
        totalComment: commentPerPost[post.id] || 0,
      };
    });

    // Sorted by highest number of comments
    return postsWithTotalComment.sort((a, b) => b.totalComment - a.totalComment);
  }

  async function getSinglePost(postId: string): Promise<IPost> {
    return await axios
      .get(`https://jsonplaceholder.typicode.com/posts/${postId}`)
      .then((response) => response.data);
  }

  async function getAllPosts(): Promise<IPost[]> {
    let posts: IPost[] = postServiceCache.get("all-posts");

    if (_.isEmpty(posts)) {
      posts = await axios
        .get("https://jsonplaceholder.typicode.com/posts")
        .then((response) => response.data);

      postServiceCache.set("all-posts", posts);
    }

    return posts;
  }

  export async function getAllComments(): Promise<IComment[]> {
    let comments: IComment[] = postServiceCache.get("all-comments");

    if (_.isEmpty(comments)) {
      comments = await axios
        .get("https://jsonplaceholder.typicode.com/comments")
        .then((response) => response.data);

      postServiceCache.set("all-comments", comments);
    }

    return comments;
  }
}

export default PostService;
