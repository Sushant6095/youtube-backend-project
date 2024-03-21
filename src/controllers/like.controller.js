import mongoose, {isValidObjectId} from "mongoose"
import { Like } from "../models/like.models.js"
import { Video } from "../models/video.models.js"
import {Comment} from "../models/comment.models.js"
import {Tweet} from "../models/tweet.models.js"
import apiError from "../utils/ApiError.js"
import apiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"


export const toggleVideoLike = asyncHandler(async (req, res) => {
    //TODO: toggle like on video
    
    // take the videoId
    const {videoId} = req.params;

    if (!isValidObjectId(videoId)) {
        throw new apiError(400, "Invalid video id.");
    }

    // searching the video in DB
    const video = await Video.findById(videoId);
    
    if (!video) {
        throw new apiError(400, "Video not found.");
    }

    // checking if the video is already liked
    const videoAlreadyLiked = await Like.findOne({
        video: video._id,
        likedBy: req.user?._id
    });

    if (videoAlreadyLiked) {
        await Like.findByIdAndDelete(videoAlreadyLiked._id);

        return res
        .status(200)
        .json(new apiResponse(200, {}, "Video disliked successfully"));
    }
    else {
        await Like.create({
            video: video._id,
            likedBy: req.user?._id
        });
    }

    // returning response
    return res
    .status(200)
    .json(new apiResponse(200, {}, "Video liked successfully"));

} );


export const toggleCommentLike = asyncHandler(async (req, res) => {
    //TODO: toggle like on comment

    // take the commentId
    const {commentId} = req.params;

    if (!isValidObjectId(commentId)) {
        throw new apiError(400, "Invalid comment id.");
    }

    // searching the video in DB
    const comment = await Comment.findById(commentId);
    
    if (!comment) {
        throw new apiError(400, "Comment not found.");
    }

    // checking if the video is already liked
    const commentAlreadyLiked = await Like.findOne({
        comment: comment._id,
        likedBy: req.user?._id
    });

    if (commentAlreadyLiked) {
        await Like.findByIdAndDelete(commentAlreadyLiked._id);

    return res
    .status(200)
    .json(new apiResponse(200, {}, "Comment disliked successfully"));

    }
    else {
        await Like.create({
            comment: comment._id,
            likedBy: req.user?._id
        });
    }

    // returning response
    return res
    .status(200)
    .json(new apiResponse(200, {}, "Comment liked successfully"));


} );


export const toggleTweetLike = asyncHandler(async (req, res) => {
    //TODO: toggle like on tweet

    // take the tweetId
    const {tweetId} = req.params;

    if (!isValidObjectId(tweetId)) {
        throw new apiError(400, "Invalid tweet id.");
    }

    // searching the video in DB
    const tweet = await Tweet.findById(tweetId);
    
    if (!tweet) {
        throw new apiError(400, "Tweet not found.");
    }

    // checking if the video is already liked
    const tweetAlreadyLiked = await Like.findOne({
        tweet: tweet._id,
        likedBy: req.user?._id
    });

    if (tweetAlreadyLiked) {
        await Like.findByIdAndDelete(tweetAlreadyLiked._id);

    return res
    .status(200)
    .json(new apiResponse(200, {}, "Tweet disliked successfully"));

    }
    else {
        await Like.create({
            tweet: tweet._id,
            likedBy: req.user?._id
        });
    }

    // returning response
    return res
    .status(200)
    .json(new apiResponse(200, {}, "Tweet liked successfully"));

    
} );


export const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos

    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user?._id), // we need to manually create Mongoose object_id as in aggregate pipeline we directly connect with MongoDB whereas in only condition we connect througn Mongoose
                video: {$exists: true}  // it excludes comments & tweets
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "likedVideo",
            }
        },
        {
            $project: {
                likedVideo: {
                    _id: 1,
                    title: 1,
                    description: 1,
                    views: 1,
                    owner: 1
                }
            }
        }
    ]);

    if (!likedVideos?.length) {
        throw new apiError(404, "user has no liked videos.");
    }

    //returning response
    return res
    .status(200)
    .json(new apiResponse(200, likedVideos, "Liked videos successfully fetched."));

} );