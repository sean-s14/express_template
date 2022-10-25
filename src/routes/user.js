const express = require('express');
const router = express.Router();

const UserSchema = require('../schemas/user');
const { authenticateToken } = require('../middleware/auth/authentication');

// ========== GET USER ==========
router.get('/', authenticateToken, async (req, res) => {
    const { user } = req;
    
    try {
        const userObj = await UserSchema.findOne({ username: user.username });
        return res.status(200).json(userObj);
    } catch(e) {
        console.log(e)
        return res.status(500).json(e.errors);
    }
});

// ========== UPDATE USER ==========
router.patch('/', authenticateToken, async (req, res) => {
    const { user, body } = req;

    try {
        const userObj = await UserSchema.findOneAndUpdate(
            { username: user.username },
            body,
            { new: true },
        );
        return res.status(200).json(userObj);
        // return res.status(200).json({ "msg": "Testing" });
    } catch(e) {
        console.log(e)
        return res.status(500).json(e.errors);
    }
});

// ========== DELETE USER ==========
router.delete('/', authenticateToken, async (req, res) => {
    const { user } = req;

    try {
        const userObj = await UserSchema.findOneAndDelete({ username: user.username });
        if (userObj === null) {
            return res.status(400).json(
                { "msg": `The account with username ${user.username} does not exist` }
            );
        }
        return res.status(200).json({ "msg": "Your account has successfully been deleted" });
    } catch(e) {
        console.log(e)
        return res.status(500).json(e.errors);
    }
});

module.exports = router