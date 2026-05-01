import { getFrontendUrl } from "../config/runtimeUrls.js";

const logBox = (lines) => {
    console.log("-----------------------------------------");
    lines.forEach((line) => console.log(line));
    console.log("-----------------------------------------");
};

export const sendResetEmail = async (email, token) => {
    const frontendUrl = getFrontendUrl();
    if (!frontendUrl) {
        console.error("Cannot generate password reset link because FRONTEND_URL is not configured");
        return false;
    }

    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    logBox([
        "PASSWORD RESET LINK GENERATED",
        `For: ${email}`,
        `Reset Link: ${resetLink}`,
    ]);

    return true;
};

export const sendOTPEmail = async (email, otp) => {
    logBox([
        "AUTH OTP GENERATED",
        `For: ${email}`,
        `OTP: ${otp}`,
    ]);

    return true;
};

export const sendTripOTPEmail = async (email, otp, pickup, destination, time) => {
    logBox([
        "TRIP OTP GENERATED",
        `For: ${email}`,
        `OTP: ${otp}`,
        `Pickup: ${pickup}`,
        `Destination: ${destination}`,
        `Scheduled Time: ${new Date(time).toLocaleString()}`,
    ]);

    return true;
};
