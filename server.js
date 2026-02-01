if (process.env.NODE_ENV !== 'production') require('dotenv').config();

const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
app.use(express.static('public')); // Serves the frontend

// THE PROCESS ROUTE (Triggered by Jotform Redirect)
app.get('/process-certificate', async (req, res) => {
    const submissionId = req.query.submission_id;
    const apiKey = process.env.JOTFORM_API_KEY;

    if (!submissionId) return res.send("Error: No Submission ID found.");

    try {
        // 1. Fetch Data from Jotform API
        const response = await axios.get(`https://api.jotform.com/submission/${submissionId}?apiKey=${apiKey}`);
        const answers = response.data.content.answers;

        // 2. Extract Name Dynamically
        let firstName = "Doctor";
        let lastName = "";

        for (let key in answers) {
            const field = answers[key];
            if (field.type === 'control_fullname') {
                firstName = field.answer.first;
                lastName = field.answer.last;
            }
        }

        const fullName = `Dr. ${firstName} ${lastName}`;

        // 3. Redirect to Frontend with Name (No Email Sending)
        res.redirect(`/?name=${encodeURIComponent(fullName)}`);

    } catch (err) {
        console.error("API Error:", err.message);
        res.status(500).send("Error retrieving data.");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on ${PORT}`));