import mongoose, { isValidObjectId } from "mongoose"
import { Comment } from "../models/comment.models.js"
import { Video } from "../models/video.models.js"
import { Like } from "../models/like.models.js"
import apiError from "../utils/ApiError.js"
import apiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"

export const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params;
    const {page = 1, limit = 10} = req.query;

    if (!isValidObjectId(videoId)) {
        throw new apiError(400, "Invalid video id")
    }

    if(page < 1 || limit > 10) {
        throw new apiError(400, "Invalid page number or limit");
    }

    // search for video in DB
    const video = await Video.findById(videoId);

    if (!video) {
        throw new apiError(400, "Video not found.");
    }

    // get comments for the video
    const videoComments = Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(video)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "commentOwner"
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "commentLikes"
            }
        },
        {
            $addFields: {
                commentLikesCount: {
                    $size: "$commentLikes"
                },
                commentOwner: {
                    $first: "$commentOwner"
                },
                isLiked: {
                    $cond: {
                        if: {$in: [req.user?._id, "$commentLikes.likedBy"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                content: 1,
                createdAt: 1,
                commentLikesCount: 1,
                commentOwner: {
                    username: 1,
                    avatar: 1
                },
                isLiked: 1
            }
        },
    ]);

    // defining options for aggregate paginate
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    }

    // using the aggregate paginate
    const comments = await Comment.aggregatePaginate(
        videoComments,
        options
    );

    if (!comments) {
        return res
        .status(200)
        .json(new apiResponse(200, {}, "Video has no comments."))
    }

    // returning response
    return res
    .status(200)
    .json(new apiResponse(200, comments, "Video comments fetched successfully."))

} );


export const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video

    // taking the comment content & video id
    const { videoId } = req.params;
    const { content } = req.body;

    if (content === "") {
        throw new apiError(400, "Content is required.");
    }

    if (!isValidObjectId(videoId)) {
        throw new apiError(400, "Invalid videoId");
    }

    // search for video in DB
    const video = await Video.findById(videoId);

    if (!video) {
        throw new apiError(400, "Video not found");
    }

    // create a new comment
    const comment = await Comment.create({
        content,
        video: video._id,
        owner: req.user?._id
    });

    if (!comment) {
        throw new apiError(400, "Error creating comment.");
    }

    // returning response
    return res
    .status(200)
    .json(new apiResponse(200, comment, "Comment created successfully."));

} );


export const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment

    // taking content from the body
    const { commentId } = req.params;
    const { content } = req.body;
    
    if (content === "") {
        throw new apiError(400, "Content is required");
    }

    if (!isValidObjectId(commentId)) {
        throw new apiError(400, "Invalid commentId");
    }

    // searching for the comment in DB
    const updateComment = await Comment.findById(commentId);

    if (!updateComment) {
        throw new apiError(400, "Comment not found")
    }

    // updating a comment if comment owner & logged in user are same
    let updatedComment;
    if (updateComment.owner.toString() === req.user?._id.toString()) {
        updatedComment = await Comment.findByIdAndUpdate(
            commentId,
            {
                $set: {content}
        
            },
            {new: true}
        )
    }

    // returning response
    return res
    .status(200)
    .json(new apiResponse(200, updatedComment, "Comment updated successfully."));

} );


export const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment

    // taking the commentId
    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) {
        throw new apiError(400, "Invalid commentId")
    }

    // searching for the comment to delete from DB
    const deleteComment = await Comment.findById(commentId);

    if (!deleteComment) {
        throw new apiError(404, "Invalid CommentId.");
    }

    // delete the comment if comment owener is the cureent logged in user
    if (deleteComment.owner.toString() === req.user?._id.toString()) {
        const deletedComment = await Comment.findByIdAndDelete(commentId)
        // if comment is deleted delete its likes
        if (deleteComment) {    
            await Like.deleteMany({comment: deletedComment._id})
        }
        else {
            throw new apiError(404, "Something went wrong while deleting comment.")
        }
    } else {
        throw new apiError(404, "Unauthorized access.");
    }

    // returning response
    return res
    .status(200)
    .json(new apiResponse(200, {}, "Comment deleted successfully."));
} );