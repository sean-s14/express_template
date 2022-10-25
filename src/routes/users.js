const express = require('express');
const router = express.Router();

const UserSchema = require('../schemas/user');
const { authenticateToken } = require('../middleware/auth');
const { isAdmin, isOwnerOrAdmin } = require('../utils/permissions/auth');
const { ERRORS } = require('../utils/error_messages');

// middleware that is specific to this router
// router.use((req, res, next) => {
//     console.log('Request:', req);
//     next()
// })

// ========== GET ALL USERS ==========
router.get('/', authenticateToken, async (req, res) => {
    const { user } = req;
    const userId = req.params.id;

    try {
        if (!isAdmin(user, userId)) {
            const allUsers = await UserSchema.find(userId, 'username email createdAt');
            return res.status(200).json(allUsers);
        } else {
            const allUsers = await UserSchema.find(userId);
            return res.status(200).json(allUsers);
        }
    } catch(e) {
        console.log(e)
        return res.status(500).json(e.errors);
    }
});

// ========== GET USER ==========
router.get('/:id', authenticateToken, async (req, res) => {
    const { user } = req;
    const userId = req.params.id;

    try {
        if (!isOwnerOrAdmin(user, userId)) {
            const userObj = await UserSchema.findById(userId, 'username email createdAt');
            return res.status(200).json(userObj);
        } else {
            const userObj = await UserSchema.findById(userId);
            return res.status(200).json(userObj);
        }
    } catch(e) {
        console.log(e)
        return res.status(500).json(e.errors);
    }
});

// ========== UPDATE USER ==========
router.patch('/:id', authenticateToken, async (req, res) => {
    const { user, body } = req;
    const userId = req.params.id;
    console.log("Body:", body);

    if (!isOwnerOrAdmin(user, userId)) {
        return res.status(403).send({"error": ERRORS.NOT_ADMIN_OR_OWNER});
    }

    if (body.hasOwnProperty('role') && !isAdmin(user)) {
        return res.status(403).send({"error": ERRORS.NOT_ADMIN});
    }

    try {
        const userObj = await UserSchema.findOneAndUpdate(
            { username: user.username },
            body,
            { new: true },
        );
        return res.status(200).json(userObj);
    } catch(e) {
        console.log(e)
        return res.status(500).json(e.errors);
    }
});

// ========== DELETE USER ==========
router.delete('/:id', authenticateToken, async (req, res) => {
    const { user } = req;
    const userId = req.params.id;

    if (!isOwnerOrAdmin(user, userId)) {
        return res.status(403).send({
            "error": "Only the owner of this account or an administrator can perform this action"
        });
    }

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