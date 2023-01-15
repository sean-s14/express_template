import * as dotenv from "dotenv";
dotenv.config();
const env: any = process.env;

import express from "express";
const router = express.Router();
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import * as EmailValidator from "email-validator";
import sgMail from "@sendgrid/mail";
sgMail.setApiKey(env.SENDGRID_API_KEY);

import { IUser, User as UserModel } from "../../../schemas/user";
import { IToken, Token as TokenModel } from "../../../schemas/token";
import {
  generateAccessToken,
  generateRefreshToken,
  ITokenUser,
  generateVerificationCode,
} from "../../../utils/auth";
import { MSG_TYPES, log } from "../../../utils/logging";

const refreshTokenOptions = { httpOnly: true, signed: true, secure: true };

// =============== SIGNUP ===============
router.post("/signup", async (req: express.Request, res: express.Response) => {
  const { email, password, password2 } = req.body;
  interface IUserBody {
    email?: string;
    password: string;
    code: string;
  }
  var userBody: IUserBody = { password: "", code: "" };

  // ========== PASSWORD VALIDATION ==========
  {
    if (!password) {
      return res.status(400).json({ password: "Please enter a password" });
    }
    if (!password2) {
      return res
        .status(400)
        .json({ password2: "Please enter a matching password" });
    }
    if (password !== password2) {
      return res.status(400).json({ password2: "Passwords do not match" });
    }
    if (password && password.length < 8) {
      return res
        .status(400)
        .json({ password: "Password must be at least 8 characters long" });
    }
    if (password && password.length > 128) {
      return res
        .status(400)
        .json({ password: "Password must be less than 128 characters long" });
    }
  }

  // ========== EMAIL VALIDATION ==========
  {
    if (email) {
      if (!EmailValidator.validate(email)) {
        return res
          .status(400)
          .json({ email: "The email entered is not a valid email address" });
      }

      try {
        // Verify that no user with username/email already exists
        const userExists = await UserModel.findOne({ email: email });
        if (userExists) {
          return res
            .status(400)
            .json({ email: "A user with this email already exists" });
        } else {
          userBody.email = email;
        }
      } catch (err: any) {
        log(err);
        return res
          .status(500)
          .json({ email: "There was an error when validating email" });
      }
    } else {
      return res
        .status(400)
        .json({ [MSG_TYPES.ERROR]: "You must enter an email address" });
    }
  }

  // ========== CREATE PASSWORD HASH ==========
  {
    try {
      var salt = bcrypt.genSaltSync(13);
      var hash = await bcrypt.hash(password, salt);
      userBody.password = hash;
    } catch (e: any) {
      log(e);
      return res
        .status(500)
        .json({ password: "There was an error when hashing your password" });
    }
  }

  // ========== CREATE USER ==========
  {
    const verificationCode = generateVerificationCode();
    userBody.code = verificationCode;

    try {
      const user = new UserModel(userBody, {}, { runValidators: true });
      await user.save();

      const msg = {
        to: user.email.toString(),
        from: "s.stocker04@outlook.com", // TODO: Change to your verified sender
        subject: "Verify Account",
        html: `Your verification code is <strong>${user.code.toString()}</strong>`,
      };

      try {
        const res = await sgMail.send(msg);
        console.log(
          "Signup Email Success Code :",
          res[0].statusCode,
          res[0].headers.date
        );
      } catch (e: any) {
        console.error(e);
        console.error(e.response.body);

        return res.status(500).json({
          [MSG_TYPES.ERROR]: `User was created, however verification code could not be sent to ${user.email.toString()}`,
        });
      }
    } catch (e: any) {
      log(e);
      return res.status(500).json({ [MSG_TYPES.ERROR]: e.message });
    }
  }

  return res
    .status(201)
    .json({ [MSG_TYPES.SUCCESS]: "Your account has been created" });
});

// =============== LOGIN ===============
/**
 * This route covers the following three types of login attempts
 * - as verified user
 * - as unverified user
 * - as unverified user with code
 */
router.post("/login", async (req: express.Request, res: express.Response) => {
  const { username, password, code: code } = req.body;
  let user;
  let isValid: boolean | null;

  // ===== CHECK FOR USERNAME & PASSWORD =====
  {
    if (!username) {
      return res
        .status(400)
        .json({ username: "You must enter your username/email" });
    }
    if (!password) {
      return res.status(400).json({ password: "Please enter your password" });
    }
  }

  // ===== FIND USER WITH EMAIL/USERNAME =====
  try {
    user = await UserModel.findOne({
      $or: [{ username: username }, { email: username }],
    });
    if (!user) {
      return res.status(404).json({
        username: "User with specified username/email could not be found",
      });
    }
  } catch (e: any) {
    log(e);
    return res
      .status(500)
      .json({ [MSG_TYPES.ERROR]: "There was an error when logging in" });
  }

  if (!user.verified) {
    // ===== VERIFY USER =====
    if (code) {
      try {
        if (user.code.toString() === code.toString()) {
          user.verified = true;
          await user.save();
        }
      } catch (e: any) {
        console.error(e);
        return res
          .status(500)
          .json({ [MSG_TYPES.ERROR]: "Unable to verify account" });
      }
    } else {
      // ===== CREATE NEW VERIFICATION CODE AND UPDATE USER =====
      {
        const verificationCode = generateVerificationCode();
        user.code = verificationCode;
        try {
          await user.save();
        } catch (e: any) {
          console.error(e);
          return res.status(500).json({
            [MSG_TYPES.ERROR]:
              "There was an error when updating your verification code",
          });
        }
      }

      // ===== SEND EMAIL WITH NEW CODE =====
      {
        const msg = {
          to: user.email.toString(),
          from: env.SENDGRID_VERIFIED_SENDER,
          subject: "Verify Account",
          html: `Your verification code is <strong>${user.code.toString()}</strong>`,
        };

        try {
          const res = await sgMail.send(msg);
          console.log(
            "Verify Account Success Code :",
            res[0].statusCode,
            res[0].headers.date
          );
        } catch (e: any) {
          console.error(e);
          console.error(e.response.body);

          return res.status(500).json({
            [MSG_TYPES.ERROR]: `Unable to send verification code to ${user.email.toString()}`,
          });
        }
      }

      return res.status(423).json({
        [MSG_TYPES.ERROR]:
          "This account must first be verified using a verification code",
      });
    }
  }

  // ===== VALIDATE PASSWORD =====
  try {
    isValid = await bcrypt.compare(password, user.password || "");
    if (!isValid)
      return res.status(400).json({ password: "Password entered is invalid" });
  } catch (e: any) {
    log(e);
    return res
      .status(500)
      .json({ password: "There was an issue validating the password" });
  }

  // ===== GENERATE ACCESS & REFRESH TOKENS =====
  {
    let user2: ITokenUser = {
      _id: user._id.toString(),
      role: user.role.toString(),
      username: user.username.toString(),
    };

    var accessToken = generateAccessToken(user2);
    if (accessToken === null) {
      return res.json({
        [MSG_TYPES.ERROR]:
          "Could not generate access token due to missing access token secret",
      });
    }

    var refreshToken = generateRefreshToken(user2);
    if (refreshToken === null) {
      return res.json({
        [MSG_TYPES.ERROR]:
          "Could not generate refresh token due to missing refresh token secret",
      });
    }
  }

  // ===== CREATE OR UPDATE TOKENS IN DB =====
  try {
    const tokenInDB = await TokenModel.findOne({ user: user._id });
    if (!tokenInDB) {
      const token = new TokenModel({
        refresh_token: refreshToken,
        access_token: accessToken,
        user: user._id,
      });
      await token.save();
    } else {
      const token = await TokenModel.findOneAndUpdate(
        { user: user._id },
        { refresh_token: refreshToken, access_token: accessToken }
      );
      token?.save();
    }
  } catch (e: any) {
    log(e);
    return res.status(500).json({
      ...e.errors,
      error: "Failed to update authentication tokens in database",
    });
  }

  res.cookie("jwt_rToken", refreshToken, refreshTokenOptions);

  return res.status(200).json({ accessToken: accessToken });
});

// =============== REFRESH TOKEN ===============
router.post("/refresh", async (req: express.Request, res: express.Response) => {
  const { jwt_rToken: refreshToken } = req.signedCookies;
  let userInDB: IUser | null;
  let refreshTokenInDB: IToken | null;

  if (refreshToken == null)
    return res
      .status(401)
      .json({ [MSG_TYPES.ERROR]: "No refresh token found in cookie" });

  try {
    // ===== FIND REFRESH TOKEN IN DATABASE =====
    refreshTokenInDB = await TokenModel.findOne({
      refresh_token: refreshToken,
    });

    if (refreshTokenInDB) {
      userInDB = await UserModel.findById(refreshTokenInDB.user);
    } else {
      return res.status(404).json({
        [MSG_TYPES.ERROR]: "Could not find refresh token in database",
      });
    }
  } catch (e: any) {
    log(e);
    return res.json({
      [MSG_TYPES.ERROR]:
        "There was an error attempting to find refresh token in the database",
    });
  }

  jwt.verify(
    refreshToken,
    env.REFRESH_TOKEN_SECRET,
    async (err: any, user: any) => {
      if (err)
        return res.status(401).json({
          [MSG_TYPES.ERROR]: "Refresh token is either invalid or has expired",
        });

      if (userInDB) {
        const new_user = {
          _id: userInDB._id.toString(),
          role: userInDB.role.toString(),
          username: userInDB.username.toString(),
        };
        // ===== GENERATE ACCESS & REFRESH TOKENS =====
        const accessToken = generateAccessToken(new_user);
        const newRefreshToken = generateRefreshToken(new_user);

        try {
          // ===== UPDATE TOKENS IN DB =====
          const token = await TokenModel.findOneAndUpdate(
            { refresh_token: refreshToken },
            { refresh_token: newRefreshToken, access_token: accessToken }
          );
          token?.save();
        } catch (e: any) {
          log(e);
          return res.status(500).json({ [MSG_TYPES.ERROR]: e.message });
        }

        res.cookie("jwt_rToken", newRefreshToken, refreshTokenOptions);

        return res.status(200).json({ accessToken: accessToken });
      } else {
        return res.status(404).json({
          [MSG_TYPES.ERROR]:
            "Could not find user matching refresh token in database",
        });
      }
    }
  );
});

// =============== LOGOUT ===============
router.delete(
  "/logout",
  async (req: express.Request, res: express.Response) => {
    const { jwt_rToken: refreshToken } = req.signedCookies;
    if (refreshToken) {
      res.clearCookie("jwt_rToken", refreshTokenOptions);
    }
    try {
      const token = await TokenModel.findOneAndDelete({
        refresh_token: refreshToken,
      });
      if (token === null) {
        return res.status(400).json({
          [MSG_TYPES.ERROR]: "No refresh token was found, unable to log out",
        });
      } else {
        // The following success message will likely not be sent due to the status code of 204
        return res
          .status(204)
          .json({ [MSG_TYPES.SUCCESS]: "You have been logged out" });
      }
    } catch (e: any) {
      log(e);
      return res.status(500).json({ [MSG_TYPES.ERROR]: e.message });
    }
  }
);

export default router;
