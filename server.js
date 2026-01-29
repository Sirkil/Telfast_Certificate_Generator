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
    // Check your Render logs to see what Jotform is sending!
    console.log("Jotform Data Received:", req.body);

    try {
        // Adjust these IDs based on your 'Unique Name' in Jotform
        const firstName = req.body.q1_name?.first || "User";
        const lastName = req.body.q1_name?.last || "";
        const userEmail = req.body.q2_email || req.body.email; // Recipient from form
        const fullName = `Dr. ${firstName} ${lastName}`;

        const imagePath = path.join(__dirname, 'Certificate.jpg');
        const image = await loadImage(imagePath);
        const canvas = createCanvas(image.width, image.height);
        const ctx = canvas.getContext('2d');

        ctx.drawImage(image, 0, 0);
        
        // Draw the Name
        ctx.font = 'bold 50px Arial';
        ctx.fillStyle = '#5e3378';
        ctx.textAlign = 'center';
        ctx.fillText(fullName, image.width / 2, 508);

        // Convert canvas to Buffer
        const buffer = canvas.toBuffer('image/jpeg');

        // Send Email with PDF Attachment
        await transporter.sendMail({
            from: `"Telfast DADD" <${process.env.GMAIL_USER}>`,
            to: userEmail, // Sends to the address input in the form
            subject: "Your DADD Certificate of Commitment",
            text: `Dear ${fullName}, attached is your certificate.`,
            attachments: [
                {
                    filename: 'Certificate.jpg', // You can wrap this in a PDF library later if needed
                    content: buffer
                }
            ]
        });

        res.status(200).send('Success');
    } catch (err) {
        console.error("Email Error:", err);
        res.status(500).send('Error');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server active on port ${PORT}`);
});
