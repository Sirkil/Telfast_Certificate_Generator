if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require('express');
const { createCanvas, loadImage } = require('canvas');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();

// Middleware to parse data and serve files
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); 

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS 
    }
});

// GET Route: Shows the success/preview page (Fixes "Cannot GET /")
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// POST Route: Handles Jotform Webhook
app.post('/webhook', async (req, res) => {
    try {
        // Jotform field mapping
        const firstName = req.body.q1_name?.first || "Member";
        const lastName = req.body.q1_name?.last || "";
        const email = req.body.q2_email || req.body.email;
        
        // Fixed "Dr." prefix as requested
        const fullName = `Dr. ${firstName} ${lastName}`;

        const imagePath = path.join(__dirname, 'Certificate.png');
        const image = await loadImage(imagePath);
        const canvas = createCanvas(image.width, image.height);
        const ctx = canvas.getContext('2d');

        ctx.drawImage(image, 0, 0);
        
        // Refined styling
        ctx.font = 'bold 50px Arial'; // Requested Arial
        ctx.fillStyle = '#5e3378';    // Requested Purple
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom'; 

        // Placement: Center width, 508px height (lands on the line)
        ctx.fillText(fullName, image.width / 2, 508);

        const buffer = canvas.toBuffer('image/jpeg');

        // Send Email Attachment
        await transporter.sendMail({
            from: `"Telfast DADD" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: "Your DADD Certificate of Commitment",
            attachments: [{ filename: 'Certificate.jpg', content: buffer }]
        });

        res.status(200).send('Success');
    } catch (err) {
        console.error("Backend Error:", err);
        res.status(500).send('Error generating certificate');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server active on port ${PORT}`);

});
