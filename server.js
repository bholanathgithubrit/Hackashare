const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const multer = require('multer');

const app = express();
const PORT = 5000;
app.use(cors());
app.use(bodyParser.json());
//signup
app.post('/signup', (req, res) => {
    const { username, email, password } = req.body;
    console.log("hi")
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    const filePath = path.join(__dirname, 'users.json');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }

        let users = [];
        if (data) {
            users = JSON.parse(data);
        }
        const existingUser = users.find(user => user.username === username || user.email === email);
        if (existingUser) {
            return res.status(409).json({ message: 'User with the same username or email already exists' });
        }
        const newUser = {
            username,
            email,
            password
        };
        users.push(newUser);
        fs.writeFile(filePath, JSON.stringify(users, null, 2), (err) => {
            if (err) {
                console.error('Error writing file:', err);
                return res.status(500).json({ message: 'Internal server error' });
            }

            res.status(201).json({ message: 'User signed up successfully' });
        });
    });
});
//login
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const filePath = path.join(__dirname, 'users.json');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }

        const users = data ? JSON.parse(data) : [];

        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            res.status(200).json({ message: 'Login successful', user });
        } else {
            res.status(400).json({ message: 'Invalid email or password' });
        }
    });
});








// Set up CORS to allow requests from your frontend
app.use(cors());

// Middleware to parse form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup multer for file upload
const upload = multer({ dest: 'uploads/' });

// Set up Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the locations.json file
app.get('/locations', (req, res) => {
    fs.readFile(path.join(__dirname, 'locations.json'), 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading locations.json:', err);
            res.status(500).send('Internal Server Error');
        } else {
            res.json(JSON.parse(data));
        }
    });
});


// Handle adding a new location
app.post('/add-location', upload.single('file'), (req, res) => {
    const { lat, lng, description } = req.body;
    const newLocation = {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        description,
        filePath: req.file ? req.file.path : null,
        timestamp: new Date().toISOString()
    };

    fs.readFile(path.join(__dirname, 'locations.json'), 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading locations.json:', err);
            return res.status(500).send('Internal Server Error');
        }

        let locations;
        try {
            locations = JSON.parse(data);
        } catch (parseError) {
            console.error('Error parsing locations.json:', parseError);
            return res.status(500).send('Internal Server Error');
        }

        if (!Array.isArray(locations)) {
            console.error('Invalid JSON format in locations.json. Expected an array.');
            return res.status(500).send('Internal Server Error');
        }

        locations.push(newLocation);

        fs.writeFile(path.join(__dirname, 'locations.json'), JSON.stringify(locations, null, 2), (err) => {
            if (err) {
                console.error('Error writing to locations.json:', err);
                return res.status(500).send('Internal Server Error');
            }
            res.json(locations);
        });
    });
});

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));






// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});