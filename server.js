if (process.env.NODE_ENV !== 'production') require('dotenv').config();

const express = require('express');
const { createCanvas, loadImage } = require('canvas');
const nodemailer = require('nodemailer');
const axios = require('axios');
const path = require('path');

const app = express();
app.use(express.static('public')); // Serves the frontend

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS 
    }
});

// 1. The Entry Point: Jotform Redirects Here
app.get('/process-certificate', async (req, res) => {
    const submissionId = req.query.submission_id;
    const apiKey = process.env.JOTFORM_API_KEY;

    if (!submissionId) return res.send("Error: No Submission ID.");

    try {
        // A. Get Data from Jotform
        const response = await axios.get(`https://api.jotform.com/submission/${submissionId}?apiKey=${apiKey}`);
        const answers = response.data.content.answers;

        // B. Find Name and Email dynamically
        let firstName = "Doctor";
        let lastName = "";
        let email = "";

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

        // C. Generate Image for EMAIL (Server-side)
        const imagePath = path.join(__dirname, 'Certificate.jpg');
        const image = await loadImage(imagePath);
        const canvas = createCanvas(image.width, image.height);
        const ctx = canvas.getContext('2d');

        ctx.drawImage(image, 0, 0);
        ctx.font = 'bold 50px Arial';
        ctx.fillStyle = '#5e3378';
        ctx.textAlign = 'center';
        // Coordinates for the email attachment
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

        // E. Redirect to Frontend with the Name (So user can see it)
        // We use encodeURIComponent to handle spaces safely
        res.redirect(`/?name=${encodeURIComponent(fullName)}&success=true`);

    } catch (err) {
        console.error("Error:", err.message);
        res.status(500).send("Error processing certificate. Please check logs.");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on ${PORT}`));