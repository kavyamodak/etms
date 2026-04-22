const getFrontendUrl = () =>
    (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");

const logBox = (lines) => {
    console.log("-----------------------------------------");
    lines.forEach((line) => console.log(line));
    console.log("-----------------------------------------");
};

export const sendResetEmail = async (email, token) => {
    const resetLink = `${getFrontendUrl()}/reset-password?token=${token}`;

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
