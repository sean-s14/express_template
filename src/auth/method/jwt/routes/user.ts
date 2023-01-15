import * as dotenv from "dotenv";
dotenv.config();
const env: any = process.env;

import express from "express";
const router = express.Router();
import bcrypt from "bcrypt";
import sgMail from "@sendgrid/mail";
sgMail.setApiKey(env.SENDGRID_API_KEY);

import { User as UserModel } from "../../../schemas/user";
import { Token as TokenModel } from "../../../schemas/token";
import {
  authenticateToken,
  checkAuthPermissions,
} from "../../../middleware/auth";
import { ERRORS, MSG_TYPES, log } from "../../../utils/logging";
import { generateVerificationCode } from "../../../utils/auth";
import { Request } from "../types";

// ========== GET USER ==========
router.get(
  "/",
  authenticateToken,
  async (req: Request, res: express.Response) => {
    const { user } = req;
    const username = user?.username;
    const projection =
      "verified _id role username email createdAt updatedAt photo";

    try {
      if (username) {
        const userObj = await UserModel.findOne(
          { username: username },
          projection
        );
        if (userObj === null) {
          return res.status(404).json({
            [MSG_TYPES.ERROR]: `User with username "${username}" could not be found`,
          });
        } else {
          return res.status(200).json(userObj);
        }
      } else {
        return res.status(400).json({
          [MSG_TYPES.ERROR]: "There was no username attached to access token",
        });
      }
    } catch (e: any) {
      log(e);
      return res.status(500).json({ [MSG_TYPES.ERROR]: e.message });
    }
  }
);

// ========== UPDATE USER ==========
router.patch(
  "/",
  authenticateToken,
  checkAuthPermissions,
  async (req: Request, res: express.Response) => {
    const { user, body } = req;
    const username = user?.username;
    const projection =
      "verified _id role username email createdAt updatedAt photo";
    const update_options = {
      new: true,
      lean: true,
      runValidators: true,
      projection: projection,
    };

    try {
      if (username) {
        const userObj = await UserModel.findOneAndUpdate(
          { username: username },
          body,
          update_options
        );
        if (userObj) {
          return res.status(200).json(userObj);
        } else {
          return res
            .status(500)
            .json({ [MSG_TYPES.ERROR]: "Unable to update specified user" });
        }
      } else {
        return res.status(400).json({
          [MSG_TYPES.ERROR]: "There was no username attached to access token",
        });
      }
    } catch (e: any) {
      log(e);
      return res.status(500).json({ [MSG_TYPES.ERROR]: e.message });
    }
  }
);

// ========== UPDATE USER PASSWORD ==========
router.patch(
  "/change-password",
  authenticateToken,
  checkAuthPermissions,
  async (req: Request, res: express.Response) => {
    const { user, body } = req;
    const { old_password, new_password, new_password2 } = body;
    const username = user?.username;
    const update_options = { lean: true };
    let new_body: { password: string } = { password: "" };

    if (!old_password) {
      return res
        .status(400)
        .json({ [MSG_TYPES.ERROR]: "You must enter your old password" });
    }

    if (!new_password || !new_password2) {
      return res
        .status(400)
        .json({ [MSG_TYPES.ERROR]: "Please enter your new password twice" });
    }

    if (new_password !== new_password2) {
      return res
        .status(400)
        .json({ [MSG_TYPES.ERROR]: "Passwords do not match" });
    }

    // ========== CREATE PASSWORD HASH ==========
    {
      try {
        var salt = bcrypt.genSaltSync(13);
        var hash = await bcrypt.hash(new_password, salt);
        new_body.password = hash;
      } catch (e: any) {
        log(e);
        return res
          .status(500)
          .json({ password: "There was an error when hashing your password" });
      }
    }

    try {
      if (username) {
        const userObj = await UserModel.findOneAndUpdate(
          { username: username },
          new_body,
          update_options
        );
        if (userObj) {
          return res
            .status(200)
            .json({ [MSG_TYPES.SUCCESS]: "Password successfully updated" });
        } else {
          return res
            .status(500)
            .json({ [MSG_TYPES.ERROR]: "Unable to update specified user" });
        }
      } else {
        return res.status(400).json({
          [MSG_TYPES.ERROR]: "There was no username attached to access token",
        });
      }
    } catch (e: any) {
      log(e);
      return res.status(500).json({ [MSG_TYPES.ERROR]: e.message });
    }
  }
);

// ========== RESET USER PASSWORD ==========
router.patch("/reset-password", async (req: Request, res: express.Response) => {
  const { body } = req;
  const { email, code, new_password, new_password2 } = body;
  const update_options = { lean: true };
  let password: string = "";
  let user;

  // ====== Get User =====
  {
    if (email) {
      try {
        user = await UserModel.findOne({ email: email });
      } catch (e: any) {
        console.error(e);
        return res
          .status(500)
          .json({ [MSG_TYPES.ERROR]: "Unable to process request" });
      }
    } else {
      return res.status(400).json({ [MSG_TYPES.ERROR]: "No email was given" });
    }
  }

  // ===== STAGE 1 =====
  if (!(code || new_password || new_password2)) {
    try {
      if (user) {
        // ===== Create New Verification Code and Update User =====
        {
          const verificationCode = generateVerificationCode();
          user.code = verificationCode;
          try {
            await user.save();
          } catch (e: any) {
            console.error(e);
            return res.status(500).json({
              [MSG_TYPES.ERROR]:
                "There was an error when updating your password reset code",
            });
          }
        }

        // ===== Create Message =====
        const msg = {
          to: user.email.toString(),
          from: env.SENDGRID_VERIFIED_SENDER,
          subject: "Password Reset Code",
          html: `The code for resetting your password is <strong>${user.code.toString()}</strong>`,
        };

        // Send Email and Success/Failed Response
        try {
          const emailRes = await sgMail.send(msg);
          console.log(
            "Password Reset Email Success :",
            emailRes[0].statusCode,
            emailRes[0].headers.date
          );
          if (emailRes) {
            return res.status(200).json({
              [MSG_TYPES.SUCCESS]: `A code has been sent to ${user.email.toString()}`,
            });
          } else {
            throw Error;
          }
        } catch (e: any) {
          console.error(e);
          console.error(e.response.body);
          return res.status(500).json({
            [MSG_TYPES.ERROR]: `Unable to send password reset code to ${user.email.toString()}`,
          });
        }
      }
    } catch (e: any) {
      console.error(e);
      return res
        .status(500)
        .json({ [MSG_TYPES.SUCCESS]: "Unable to process request" });
    }
  }

  // ===== STAGE 2 =====
  if (code && !(new_password || new_password2)) {
    if (code === user?.code.toString()) {
      return res
        .status(200)
        .json({ [MSG_TYPES.SUCCESS]: "Success! Enter your new password" });
    } else {
      return res.status(400).json({ [MSG_TYPES.ERROR]: "Code is incorrect" });
    }
  }

  // Password Mismatch
  if (new_password !== new_password2) {
    return res
      .status(400)
      .json({ [MSG_TYPES.ERROR]: "Passwords entered do not match" });
  }

  // Missing Field
  if (!(email && code && new_password && new_password2)) {
    return res
      .status(423)
      .json({ [MSG_TYPES.ERROR]: "Something went wrong, try again" });
  }

  // ========== STAGE 3 ==========

  // ========== Create Password Hash ==========
  {
    try {
      const salt = bcrypt.genSaltSync(13);
      const hash = await bcrypt.hash(new_password, salt);
      password = hash;
    } catch (e: any) {
      log(e);
      return res
        .status(500)
        .json({ password: "There was an error when hashing your password" });
    }
  }

  // ===== Update User =====
  try {
    if (user) {
      user.password = password;
      await user.save();
      return res
        .status(200)
        .json({
          [MSG_TYPES.SUCCESS]: "Password has been updated successfully",
        });
    } else {
      return res
        .status(404)
        .json({
          [MSG_TYPES.ERROR]:
            "Error occurred when updating user password, try again",
        });
    }
  } catch (e: any) {
    log(e);
    return res.status(500).json({ [MSG_TYPES.ERROR]: e.message });
  }
});

// ========== DELETE USER ==========
router.delete("/", authenticateToken, async (req: Request, res: any) => {
  const { user } = req;
  const username = user?.username;

  try {
    if (username) {
      const userObj = await UserModel.findOneAndDelete({ username: username });
      if (userObj === null) {
        return res.status(404).json({
          [MSG_TYPES.ERROR]: `The account with username ${username} does not exist`,
        });
      } else {
        await TokenModel.findOneAndDelete({ user: userObj._id });
      }
    } else {
      return res.status(400).json({
        [MSG_TYPES.ERROR]: "There was no username attached to access token",
      });
    }
    return res
      .status(200)
      .json({ success: "Your account has successfully been deleted" });
  } catch (e: any) {
    log(e);
    return res.status(500).json({ [MSG_TYPES.ERROR]: e.message });
  }
});

export default router;
