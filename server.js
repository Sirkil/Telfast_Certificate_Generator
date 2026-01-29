if (process.env.NODE_ENV !== 'production') require('dotenv').config();

const express = require('express');
const { createCanvas, loadImage } = require('canvas');
const nodemailer = require('nodemailer');
const axios = require('axios');
const path = require('path');

const app = express();
app.use(express.static('public')); // Serves the frontend

// 1. Email Configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS 
    }
});

// 2. THE NEW API ROUTE (Replaces Webhook)
app.get('/process-certificate', async (req, res) => {
    const submissionId = req.query.submission_id;
    const apiKey = process.env.JOTFORM_API_KEY;

    if (!submissionId) return res.send("Error: No Submission ID found in URL.");

    try {
        // A. Fetch Data from Jotform API
        const response = await axios.get(`https://api.jotform.com/submission/${submissionId}?apiKey=${apiKey}`);
        const answers = response.data.content.answers;

        // B. Extract Name and Email Dynamically
        let firstName = "Doctor";
        let lastName = "";
        let email = "";

        // Loop through all answers to find the correct fields regardless of ID
        for (let key in answers) {
            const field = answers[key];
            if (field.type === 'control_fullname') {
                firstName = field.answer.first;
                lastName = field.answer.last;
            } else if (field.type === 'control_email') {
                email = field.answer;
            }
        }

        const fullName = `Dr. ${firstName} ${lastName}`;

        // C. Generate Image for EMAIL Attachment (Server-Side)
        const imagePath = path.join(__dirname, 'Certificate.jpg');
        const image = await loadImage(imagePath);
        const canvas = createCanvas(image.width, image.height);
        const ctx = canvas.getContext('2d');

        ctx.drawImage(image, 0, 0);
        ctx.font = 'bold 50px Arial';
        ctx.fillStyle = '#5e3378';
        ctx.textAlign = 'center';
        // Coordinates for server-generated image
        ctx.fillText(fullName, image.width / 2, 508);

        const buffer = canvas.toBuffer('image/jpeg');

        // D. Send Email
        await transporter.sendMail({
            from: `"Telfast DADD" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: "Your DADD Certificate of Commitment",
            text: `Dear ${fullName}, please find your certificate attached.`,
            attachments: [{ filename: 'Certificate.jpg', content: buffer }]
        });

        console.log(`Email sent to ${email}`);

        // E. Redirect to Frontend with Name (So user sees it live)
        res.redirect(`/?name=${encodeURIComponent(fullName)}&success=true`);

    } catch (err) {
        console.error("API Processing Error:", err.message);
        res.status(500).send("Error processing certificate. Please check Render logs.");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on ${PORT}`));