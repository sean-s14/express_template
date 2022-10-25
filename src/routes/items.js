const express = require('express');
const router = express.Router();

const ItemSchema = require('../schemas/item');
const { authenticateToken } = require('../middleware/auth/authentication');
const { isAdmin, isOwner } = require('../middleware/permissions/auth');
const { ERRORS } = require('../utils/error_messages');

// middleware that is specific to this router
// router.use((req, res, next) => {
//     console.log('Request:', req);
//     next()
// })

// =============== CREATE ITEM ===============
router.post('/', authenticateToken, async (req, res) => {
    const { user, body } = req;

    try {
        const itemObj = new ItemSchema(Object.assign({ userId: user.id }, body));
        await itemObj.save();
        return res.status(201).json(itemObj)
    } catch(e) {
        console.log(e);
        // console.log("Errors:", e.errors);
        return res.status(500).json(e.errors)
        // return res.status(400).json({ err: "Something went wrong when creating account" })
    }
});

// =============== GET ALL ITEMS ===============
router.get('/', authenticateToken, async (req, res) => {
    const { user } = req;

    try {
        const allItems = await ItemSchema.find({ userId: user.id });
        return res.status(200).json(allItems);
    } catch(e) {
        console.log(e)
        return res.status(500).json(e.errors);
    }
});

// =============== GET ITEM ===============
router.get('/:id', authenticateToken, async (req, res) => {
    const { user } = req;
    const { id } = req.params;

    try {
        const itemObj = await ItemSchema.findOne({ _id: id });

        if (isOwner(user, itemObj) || isAdmin(user)) {
            return res.status(200).json(itemObj);
        } else {
            let itemObjLimited = {
                _id: itemObj._id,
                title: itemObj.title,
                userId: itemObj.userId,
                createdAt: itemObj.createdAt,   
            }
            return res.status(200).json(itemObjLimited);
        }
    } catch(e) {
        console.log(e)
        return res.status(500).json(e.errors);
    }
});

// =============== UPDATE ITEM ===============
router.patch('/:id', authenticateToken, async (req, res) => {
    const { user, body } = req;
    const { id } = req.params;

    try {
        const itemObj = await ItemSchema.findOne({ _id: id });

        if (itemObj === null) {
            return res.status(404).json({ error: `Item could not be found` });
        }

        if (isOwner(user, itemObj) || isAdmin(user)) {
            const itemObjUpdated = await ItemSchema.findOneAndUpdate(
                { _id: id },
                body,
                { new: true },
            );
            return res.status(200).json(itemObjUpdated);
        } else {
            return res.status(403).send({
                "error": ERRORS.NOT_ADMIN_OR_OWNER
            });
        }
    } catch(e) {
        console.log(e)
        return res.status(500).json(e.errors);
    }
});

// =============== DELETE ITEM ===============
router.delete('/:id', authenticateToken, async (req, res) => {
    const { user } = req;
    const { id } = req.params;

    try {
        const itemObj = await ItemSchema.findOne({ _id: id });

        if (itemObj === null) {
            return res.status(404).json({ error: `Item could not be found` });
        }

        if (isOwner(user, itemObj) || isAdmin(user)) {
            const itemObjDeleted = await ItemSchema.findOneAndDelete({ _id: id });
            return res.status(200).json({ msg: `The item titled "${itemObjDeleted.title}" has been deleted` });
        } else {
            return res.status(403).send({
                "error": ERRORS.NOT_ADMIN_OR_OWNER
            });
        }
    } catch(e) {
        console.log(e)
        return res.status(500).json(e.errors);
    }
});

module.exports = router