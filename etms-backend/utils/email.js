import nodemailer from "nodemailer";

export const sendResetEmail = async (email, token) => {
    const frontendUrl = "http://localhost:3000";
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    const mailOptions = {
        from: process.env.SMTP_FROM || '"Tranzo Support" <support@tranzo.com>',
        to: email,
        subject: "Password Reset Request",
        html: `
      <h2>Reset Your Password</h2>
      <p>Click the link below to reset your password. This link will expire in 15 minutes.</p>
      <a href="${resetLink}" style="padding: 10px 20px; background-color: #10B981; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
      <p>If you didn't request this, please ignore this email.</p>
    `,
    };

    try {
        let transporter;

        // If no real SMTP credentials are provided, use a fake Ethereal email account for testing
        if (!process.env.SMTP_USER) {
            console.log("Creating temporary Ethereal email account for testing...");
            const testAccount = await nodemailer.createTestAccount();

            transporter = nodemailer.createTransport({
                host: "smtp.ethereal.email",
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });
        } else {
            transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT || 587,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });
        }

        const info = await transporter.sendMail(mailOptions);

        if (!process.env.SMTP_USER) {
            console.log('-----------------------------------------');
            console.log('📧 TEST EMAIL SENT SUCCESSFULLY!');
            console.log(`Recipient: ${email}`);
            console.log(`Reset Link: ${resetLink}`);
            console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
            console.log('☝️  CLICK THE LINK ABOVE TO VIEW THE HTML EMAIL ☝️');
            console.log('-----------------------------------------');
        }

        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        console.log(`Fallback Reset Link: ${resetLink}`);
        return false;
    }
};

export const sendOTPEmail = async (email, otp) => {
    const mailOptions = {
        from: process.env.SMTP_FROM || '"Tranzo Support" <support@tranzo.com>',
        to: email,
        subject: "Your Verify Code - Tranzo",
        html: `
      <h2>Verify Your Email</h2>
      <p>Your one-time verification code is:</p>
      <h1 style="letter-spacing: 5px; font-size: 36px; color: #10B981;">${otp}</h1>
      <p>This code will expire in 10 minutes. If you did not sign up for Tranzo, you can safely ignore this email.</p>
    `,
    };

    try {
        let transporter;

        if (!process.env.SMTP_USER) {
            console.log("Creating temporary Ethereal email account for OTP...");
            const testAccount = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
                host: "smtp.ethereal.email",
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });
        } else {
            transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT || 587,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });
        }

        const info = await transporter.sendMail(mailOptions);

        if (!process.env.SMTP_USER) {
            console.log('-----------------------------------------');
            console.log('📧 TEST OTP EMAIL SENT SUCCESSFULLY!');
            console.log(`Recipient: ${email}`);
            console.log(`OTP Code: ${otp}`);
            console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
            console.log('-----------------------------------------');
        }

        return true;
    } catch (error) {
        console.error("Error sending OTP email:", error);
        console.log(`Fallback OTP: ${otp}`);
        return false;
    }
};

export const sendTripOTPEmail = async (email, otp, pickup, destination, time) => {
    const mailOptions = {
        from: process.env.SMTP_FROM || '"Tranzo Trips" <trips@tranzo.com>',
        to: email,
        subject: "Your Trip OTP - Tranzo Enterprise",
        html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 1rem;">
        <h2 style="color: #10B981; margin-bottom: 20px;">Your Trip is Scheduled!</h2>
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 0.5rem; margin-bottom: 20px;">
          <p><strong>Pickup:</strong> ${pickup}</p>
          <p><strong>Destination:</strong> ${destination}</p>
          <p><strong>Scheduled Time:</strong> ${new Date(time).toLocaleString()}</p>
        </div>
        <p>Please share this Auth Code with your driver to start the trip:</p>
        <div style="background-color: #10B981; color: white; padding: 20px; text-align: center; border-radius: 0.5rem; margin-bottom: 20px;">
          <h1 style="letter-spacing: 10px; font-size: 48px; margin: 0;">${otp}</h1>
        </div>
        <p style="color: #6b7280; font-size: 0.875rem;">This code is required for your security. Do not share it with anyone except your assigned driver.</p>
      </div>
    `,
    };

    try {
        let transporter;
        if (!process.env.SMTP_USER) {
            console.log("Creating temporary Ethereal account for Trip OTP...");
            const testAccount = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
                host: "smtp.ethereal.email",
                port: 587,
                secure: false,
                auth: { user: testAccount.user, pass: testAccount.pass },
            });
        } else {
            transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT || 587,
                auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            });
        }

        const info = await transporter.sendMail(mailOptions);

        console.log('-----------------------------------------');
        console.log('🚕 TRIP OTP EMAIL DISPATCHED');
        console.log(`To: ${email}`);
        console.log(`OTP: ${otp}`);
        if (!process.env.SMTP_USER) {
            console.log(`Preview: ${nodemailer.getTestMessageUrl(info)}`);
        }
        console.log('-----------------------------------------');

        return true;
    } catch (error) {
        console.error("Error sending trip OTP email:", error);
        return false;
    }
};

