if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require('express');
const { createCanvas, loadImage } = require('canvas');
const nodemailer = require('nodemailer');
const axios = require('axios'); // Add this for API calls
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Configure your GMAIL and JOTFORM secrets in Render dashboard
const GMAIL_USER = process.env.GMAIL_USER; //
const GMAIL_PASS = process.env.GMAIL_PASS; 
const JOTFORM_API_KEY = process.env.JOTFORM_API_KEY; 

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: GMAIL_USER, pass: GMAIL_PASS }
});

// Route to fetch data from API and process certificate
app.get('/process-certificate', async (req, res) => {
    const submissionId = req.query.submission_id;

    if (!submissionId) return res.status(400).send("No Submission ID provided.");

    try {
        // Fetch data from Jotform API
        const response = await axios.get(`https://api.jotform.com/submission/${submissionId}?apiKey=${JOTFORM_API_KEY}`);
        const data = response.data.content.answers;

        // Map fields manually (Check your form's unique names)
        // Usually: q1_name (Full Name), q2_email (Email)
        let firstName = "Member", lastName = "", email = "";
        
        for (let key in data) {
            if (data[key].name === 'name' || data[key].text.includes('Name')) {
                firstName = data[key].answer.first;
                lastName = data[key].answer.last;
            }
            if (data[key].name === 'email' || data[key].text.includes('Email')) {
                email = data[key].answer;
            }
        }

        const fullName = `Dr. ${firstName} ${lastName}`;
        const imagePath = path.join(__dirname, 'CERTIFICATE_Edited_V4.jpg');
        const image = await loadImage(imagePath);
        
        const canvas = createCanvas(image.width, image.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);

        // Styling
        ctx.font = 'bold 50px Arial';
        ctx.fillStyle = '#5e3378'; // Your specific purple
        ctx.textAlign = 'center';
        ctx.fillText(fullName, image.width / 2, 508);

        const buffer = canvas.toBuffer('image/jpeg');

        // Send Email
        await transporter.sendMail({
            from: `"Telfast DADD" <${GMAIL_USER}>`,
            to: email,
            subject: "Your DADD Certificate",
            attachments: [{ filename: 'Certificate.jpg', content: buffer }]
        });

        // Redirect user to the success page
        res.redirect('/?success=true');
    } catch (err) {
        console.error(err);
        res.status(500).send("API Error");
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server live on ${PORT}`));