import nodeMailer from "nodemailer";

// Configure NodeMailer transport
let transporter = nodeMailer.createTransport({
  service: "Gmail", // or use any other email provider
  auth: {
    user: process.env.NODEMAILER_USER, // your email
    pass: process.env.NODEMAILER_PASS, // your email password
  },
});

export default transporter;
