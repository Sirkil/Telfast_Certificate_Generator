// Load environment variables for local testing
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require('express');
const { createCanvas, loadImage } = require('canvas');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();

// Middleware to parse data and serve static files from a 'public' folder
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); 

// Email Transporter Configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER, // e.g., ahmedtanany25@gmail.com
        pass: process.env.GMAIL_PASS  // 16-character App Password
    }
});

// GET Route: Fixes "Cannot GET /" by serving your index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// POST Route: Handles Jotform Webhook
app.post('/webhook', async (req, res) => {
    console.log("Incoming Jotform Data:", JSON.stringify(req.body)); // Log data for debugging

    try {
        // Extracting names and email based on standard Jotform naming
        const firstName = req.body.name?.first || "Member";
        const lastName = req.body.name?.last || "";
        const email = req.body.email || req.body.email; // Recipient email
        
        if (!email) {
            console.error("No email address found in the webhook data!");
            return res.status(400).send("Email missing");
        }

        const fullName = `Dr. ${firstName} ${lastName}`; // Fixed Dr. prefix

        const imagePath = path.join(__dirname, 'Certificate.jpg');
        const image = await loadImage(imagePath);
        const canvas = createCanvas(image.width, image.height);
        const ctx = canvas.getContext('2d');

        ctx.drawImage(image, 0, 0);
        
        // Text Styling
        ctx.font = 'bold 50px Arial'; // Requested Arial font
        ctx.fillStyle = '#5e3378';    // Requested text color
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom'; 

        // Placement (Middle width, adjusted height for the line)
        ctx.fillText(fullName, image.width / 2, 508);

        const buffer = canvas.toBuffer('image/jpeg');

        // Sending Email
        await transporter.sendMail({
            from: `"Telfast DADD" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: "Your DADD Certificate of Commitment",
            text: `Hello ${fullName}, please find your certificate attached.`,
            attachments: [{ filename: 'Certificate.jpg', content: buffer }]
        });

        console.log(`Certificate successfully emailed to ${email}`);
        res.status(200).send('Success');
    } catch (err) {
        console.error("CRITICAL EMAIL ERROR:", err.message);
        res.status(500).send('Processing Error');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server active on port ${PORT}`);

});
