const express = require('express');
const router = express.Router();

const UserSchema = require('../schemas/user');
const { authenticateToken } = require('../utils/authentication');

// middleware that is specific to this router
router.use((req, res, next) => {
    // console.log('Request:', req);
    next()
})

router.get('/', authenticateToken, async (req, res) => {
    const { user } = req;

    try {
        const userObj = await UserSchema.findOne({ user: user.username });
        return res.status(200).json(userObj);
    } catch(e) {
        console.log(e)
        return res.status(500).json(e.errors);
    }
});

module.exports = router