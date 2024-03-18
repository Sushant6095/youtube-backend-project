import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {

// TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

 // search for your channel in the DB
 
 const channel = await User.findById(req.user?._id);

 if (!channel) {
     throw new apiError(400, "Channel not found.");
 }

 // if their is channel fetch (total videos views, total subscribers, total videos, total likes)

 const channelStats = await Video.aggregate([
     {
         $match: {
             owner: new mongoose.Types.ObjectId(channel),
         }
     },
     {
         $lookup: {
             from: "likes",
             localField: "_id",
             foreignField: "video",
             as: "video_likes",
         }
     },
     {
         $lookup: {
             from: "subscriptions",
             localField: "owner",
             foreignField: "channel",
             as: "total_subscribers"
         }
     },
     {
        $group: {
             _id: null,
             TotalVideos: {$sum : 1},    // sum to get all videos of the user
             TotalViews: {$sum : "$views"},    
             TotalSubscribers: {
                 $first: {
                     $size: "$total_subscribers"
                 }
             },
             TotalLikes: {
                 $first: {
                     $size: "$video_likes"
                 }
             },

        }
     },
     {
         $project: {
            TotalVideos: 1,
            TotalSubscribers: 1,
            TotalViews: 1,
            TotalLikes: 1,
         }
     }
 ]);

 // return response
 return res
 .status(200)
 .json(new apiResponse(200, channelStats, "Channel stats fetched successfully."))

} );





const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
})

export {
    getChannelStats, 
    getChannelVideos
    }