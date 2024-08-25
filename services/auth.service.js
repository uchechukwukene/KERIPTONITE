import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import { storeOtp } from "./otp.services.js";
import {
  BadRequestError,
  DuplicateError,
  InternalServerError,
  InvalidError,
  NotFoundError,
} from "../lib/appError.js";
import {
  buildOtpHash,
  codeGenerator,
  generateUniqueApiKey,
  verifyOTP,
} from "../utils/codeGenerator.js";
import { sendEmail } from "../config/nodemailerConfig.js";
import bcrypt from "bcryptjs";
import Notification from "../models/notification.model.js";
import env from "../config/env.js";
import crypto from "crypto";

class AuthService {
  async register(username, email, password) {
    let existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new BadRequestError("Email already exists, please login");
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate a random and unique API key
    const apiKey = generateUniqueApiKey();

    const otp = codeGenerator(5);
    const hash = buildOtpHash(email, otp, env.otpKey, 10);

    const isVerified = false;
    await storeOtp(email, otp);
    let createUser;
    try {
      createUser = new User({
        username,
        email,
        password: hashedPassword,
        apiKey,
        otpCode: hash,
      });
      await createUser.save();
    } catch (error) {
      console.log(error);
      throw new InternalServerError(
        "Something went wrong with creating a user"
      );
    }
    const mailData = {
      email: email,
      subject: "OTP for Account Verification",
      type: "html",
      html: `<!doctype html>
    <html>
        <head>
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        </head>
        <body style="font-family: sans-serif;">
            <div style="display: block; margin: auto; max-width: 600px;" class="main">
            <h1 style="font-size: 18px; font-weight: bold; margin-top: 20px">Hello ${email},</h1>
            <p>Verify your account:</p>
            <p>One Time Password ${otp}</p>
            <p>Please note that this link is temporary and will expire in 5mins. If you did not initiate an account creation with us, you can safely ignore this email.</p>
            <p>If you have any questions or need further assistance, please contact our support team at uchesolomon61@gmail.com.</p>
            <p>Best regards,</p>
            <p>Kryptonite.</p>
            </div>
        </body>
    </html>`,
      text: `Your OTP for account verification is: ${otp}`,
    };

    try {
      await sendEmail(mailData);
    } catch (error) {
      console.log(error);
      throw new InternalServerError("Failed to send OTP email");
    }
    await Notification.create({
      note: `You have successfully  created a new account`,
      user_id: createUser._id,
    });
    return { createUser, hash, email };
  }

  async userOtpVerifcation({ body, email }) {
    const { otpCode, hash } = body;

    try {
      // Find the user by email
      const user = await User.findOne({
        email: email,
        isVerified: false,
      });

      // Handle if user is not found
      if (!user) {
        throw new NotFoundError("User not found");
      }

      // Check if the user's OTP is already verified
      if (user.isVerified) {
        throw new DuplicateError(
          "OTP Code has already been verified. You can log in."
        );
      }

      // Verify the OTP
      const verifyOtp = verifyOTP(email, otpCode, hash, env.otpKey);

      // Handle if OTP verification fails
      if (!verifyOtp) {
        throw new InvalidError("Incorrect OTP code");
      }

      // Check if the provided OTP hash matches the stored hash
      if (user.otpCode !== hash) {
        throw new InvalidError("OTP mismatch");
      }

      user.otpCode = "";
      user.isVerified = true;
      const randToken = codeGenerator(5);
      user.token = randToken;

      // Generate JWT token
      const token = jwt.sign({ id: user._id, email: user.email }, env.jwt_key, {
        expiresIn: "1h",
      });

      // Save the updated user data
      await user.save();

      // Return the generated token
      return { token };
    } catch (error) {
      // Handle and log errors appropriately
      console.error(error);
      throw error;
    }
  }

  async login({ email, password }) {
    const checkUser = await User.findOne({ email });

    // If user not found, throw error
    if (!checkUser) {
      throw new InvalidError("Invalid Email or password");
    }
    // Compare passwords
    const isMatch = await bcrypt.compare(password, checkUser.password);

    // If passwords do not match, throw error
    if (!isMatch) {
      throw new InvalidError("Invalid email or Password");
    }

    // Check if OTP is verified
    if (!checkUser.isVerified) {
      throw new BadRequestError(
        "Please verify your account using the OTP sent to your email"
      );
    }

    // Generate OTP
    const rawOtpCode = codeGenerator(5);
    const hash = buildOtpHash(email, rawOtpCode, env.otpKey, 10);

    // Save OTP in the user record (ensure OTP field exists in user schema)
    checkUser.passwordOtp = hash;
    await checkUser.save();

    const mailData = {
      email: checkUser.email,
      subject: "OTP for Account Verification",
      type: "html",
      html: `<!doctype html>
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    </head>
    <body style="font-family: sans-serif;">
        <div style="display: block; margin: auto; max-width: 600px;" class="main">
        <h1 style="font-size: 18px; font-weight: bold; margin-top: 20px">Hello ${email},</h1>
        <p>Verify your account:</p>
        <p>One Time Password ${rawOtpCode}</p>
        <p>Please note that this link is temporary and will expire in 5mins. If you did not initiate an account creation with us, you can safely ignore this email.</p>
        <p>If you have any questions or need further assistance, please contact our support team at uchesolomon61@gmail.com.</p>
        <p>Best regards,</p>
        <p>Kryptonite.</p>
        </div>
    </body>
</html>`,
      text: `Your One Time Password is: ${rawOtpCode}`,
    };

    //sent otp
    try {
      await sendEmail(mailData);
    } catch (error) {
      console.log(error);
      throw new InternalServerError("Failed to send OTP email");
    }

    return { message: "OTP sent to your email", hash, email };
  }

  async userLoginOtpVerifcation({ body, email }) {
    const { otpCode, hash } = body;

    try {
      // Find the user by email
      const user = await User.findOne({
        email: email,
      });

      // Handle if user is not found
      if (!user) {
        throw new NotFoundError("User not found");
      }
      // Verify the OTP
      const verifyOtp = verifyOTP(email, otpCode, hash, env.otpKey);

      // Handle if OTP verification fails
      if (!verifyOtp) {
        throw new InvalidError("Incorrect OTP code");
      }

      // Check if the provided OTP hash matches the stored hash
      if (user.passwordOtp !== hash) {
        throw new InvalidError("OTP mismatch");
      }

      user.passwordOtp = "";
      const randToken = codeGenerator(5);
      user.token = randToken;

      // Generate JWT token
      const token = jwt.sign({ user }, env.jwt_key, {
        expiresIn: "1h",
      });

      // Save the updated user data
      await user.save();

      // Return the generated token
      return { token };
    } catch (error) {
      // Handle and log errors appropriately
      console.error(error);
      throw error;
    }
  }

  async verifyOtp({ email, otp }) {
    const checkUser = await User.findOne({ email });

    if (!checkUser) {
      throw new InvalidError("Invalid Email or OTP");
    }

    if (checkUser.otp !== otp) {
      throw new InvalidError("Invalid OTP");
    }

    // Clear OTP after successful verification
    checkUser.otp = null;
    await checkUser.save();

    // Convert user to JSON
    const user = checkUser.toJSON();

    // Sign JWT token
    const token = jwt.sign({ ...user }, env.jwt_key);

    return { token };
  }

  // async generateApiKey(userId) {
  //   const apiKey = crypto.randomBytes(32).toString("hex");
  //   try {
  //     await User.updateOne({ _id: userId }, { apiKey });
  //     return apiKey;
  //   } catch (error) {
  //     throw new InternalServerError("Server error...");
  //   }
  // }

  async generateApiKey({ user }) {
    // Validate user object (assuming it's required)
    if (!user) {
      throw new Error("Invalid user object provided");
    }
    try {
      const checkUser = await User.findOne({ email: user.email });
      if (!checkUser) throw new NotFoundError("User does not exist");
      // Generate random API key (assuming Mongoose is used)
      const apiKeyCode = crypto.randomBytes(32).toString("hex");
      checkUser.apiKey = apiKeyCode;
      await checkUser.save();

      return { checkUser };
    } catch (error) {
      console.error("Error generating API key:", error);
      throw new InternalServerError("Error generating API key");
    }
  }

  async invalidateApiKey({ user }) {
    if (!user) {
      throw new Error("Invalid user object provided");
    }
    try {
      const checkUser = await User.findOne({ email: user.email });
      if (!checkUser) throw new NotFoundError("User does not exist");
      // Generate random API key (assuming Mongoose is used)
      checkUser.apiKey = "";
      await checkUser.save();
      return { checkUser };
    } catch (error) {
      console.error("Error generating API key:", error);
      throw new InternalServerError("Error invalidating generating API key");
    }
  }

  async findUserByApiKey(apiKey) {
    const user = await User.findOne({ apiKey });
    if (!user) {
      throw new NotFoundError("API key not found");
    }
    return user;
  }

  async forgotPassword(body) {
    const { email } = body;
    const checkUser = await User.findOne({ email });
    if (!checkUser) throw new NotFoundError("account does not exist");

    const otpCode = codeGenerator(5);
    const key = codeGenerator(8);

    const hash = buildOtpHash(email, otpCode, key, 15);
    checkUser.password = hash;
    await checkUser.save();

    const mailData = {
      email,
      subject: "Password Reset",
      type: "html",
      html: `<p>Your OTP for account Password Reset is: ${otpCode}</p>`,
      text: `Your OTP for account Password Reset is: ${otpCode}`,
    };
    try {
      await sendEmail(mailData);
      console.log("OTP sent ...");
    } catch (error) {
      throw new InternalServerError("Failed to send Password Reset email");
    }
  }

  async resetPassword(body, email) {
    const { code, hash } = body;
    const checkUser = await User.findOne({ email });
    if (!checkUser) throw new NotFoundError("account does not exist");

    const verifyOtp = verifyOTP(email, code, hash, env.otpKey);
    if (!verifyOtp) throw new InvalidError("Wrong OTP code");

    const password = await bcrypt.hash(body.password, 12);
    checkUser.password = password;
    const randToken = codeGenerator(4);

    checkUser.token = randToken;
    await checkUser.save();

    await Notification.create({
      note: `You have successfully changed your password`,
      user_id: checkUser._id,
    });

    return true;
  }

  async resendOtp(body) {
    const checkUser = await User.findOne({ email: body.email });
    if (!checkUser) throw new NotFoundError("User does not exist");

    if (checkUser.isVerified) {
      throw new BadRequestError("Account already verified");
    }

    const rawOtpCode = codeGenerator(5);
    const hash = buildOtpHash(body.email, rawOtpCode, env.otpKey, 10);

    checkUser.otpCode = hash;
    await checkUser.save();

    const mailData = {
      email: body.email,
      subject: "OTP for Account Verification",
      type: "html",
      html: `<p>Your OTP for account verification is: ${rawOtpCode}</p>`,
      text: `Your OTP for account verification is: ${rawOtpCode}`,
    };
    try {
      await sendEmail(mailData);
      console.log("reset OTP sent...");
    } catch (error) {
      console.log(error);
      throw new InternalServerError("Failed to send OTP email");
    }
    return { hash, email: body.email };
  }
}

export default new AuthService();
