const express = require("express");
const nodemailer = require("nodemailer");

const router = express.Router();

// POST /api/contact - public contact form
router.post("/contact", async (req, res) => {
  try {
    const { name, email, message } = req.body || {};
    if (!name || !email || !message) {
      return res
        .status(400)
        .json({ error: "Name, email and message are required" });
    }

    // Basic email sanity check
    const emailOk = /.+@.+\..+/.test(String(email));
    if (!emailOk)
      return res.status(400).json({ error: "Please provide a valid email" });

    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const port = Number(process.env.SMTP_PORT || 465);
    const secure =
      String(process.env.SMTP_SECURE || "true").toLowerCase() === "true";
    const user = process.env.SMTP_USER;
    // Allow app password entered with spaces (e.g., from copy-paste) by stripping them
    const pass = (process.env.SMTP_PASS || "").replace(/\s+/g, "");

    if (!user || !pass) {
      return res.status(500).json({ error: "Email service is not configured" });
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure, // true for 465, false for 587
      auth: { user, pass },
    });

    const to =
      process.env.CONTACT_RECEIVER || "ashwithgodishala.work@gmail.com";

    const info = await transporter.sendMail({
      from: `Contact Form <${user}>`,
      to,
      replyTo: email,
      subject: `New contact message from ${name}`,
      text: `From: ${name} <${email}>\n\n${message}`,
      html: `<p><strong>From:</strong> ${name} &lt;${email}&gt;</p><p>${String(
        message
      ).replace(/\n/g, "<br>")}</p>`,
    });

    return res.status(200).json({ ok: true, id: info.messageId });
  } catch (err) {
    console.error("/contact error:", err);
    return res.status(500).json({ error: "Failed to send message" });
  }
});

module.exports = router;
