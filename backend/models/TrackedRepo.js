const mongoose = require('mongoose');

const TrackedRepoSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    repoName: {
        type: String,
        required: true
    },
    repoUrl: {
        type: String,
        required: true
    },
    language: {
        type: String,
        default: 'Unknown'
    },
    status: {
        type: String,
        enum: ['Exploring', 'Active', 'Completed'],
        default: 'Exploring'
    },
    notes: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('TrackedRepo', TrackedRepoSchema);
