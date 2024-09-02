const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const Web3 = require('web3'); // Library to interact with the blockchain

const app = express();
const PORT = 5000;

const abi = [{
        "anonymous": false,
        "inputs": [{
                "indexed": true,
                "internalType": "address",
                "name": "userAddress",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "eventName",
                "type": "string"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "description",
                "type": "string"
            }
        ],
        "name": "EventCreated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [{
                "indexed": true,
                "internalType": "address",
                "name": "userAddress",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "username",
                "type": "string"
            }
        ],
        "name": "UserRegistered",
        "type": "event"
    },
    {
        "inputs": [{
                "internalType": "string",
                "name": "_eventName",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_description",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_date",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "_latitude",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_longitude",
                "type": "uint256"
            },
            {
                "internalType": "string",
                "name": "_fileUrl",
                "type": "string"
            }
        ],
        "name": "createEvent",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{
            "internalType": "uint256",
            "name": "index",
            "type": "uint256"
        }],
        "name": "getEvent",
        "outputs": [{
                "internalType": "string",
                "name": "eventName",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "latitude",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "longitude",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getEvents",
        "outputs": [{
            "components": [{
                    "internalType": "string",
                    "name": "eventName",
                    "type": "string"
                },
                {
                    "internalType": "string",
                    "name": "description",
                    "type": "string"
                },
                {
                    "internalType": "string",
                    "name": "date",
                    "type": "string"
                },
                {
                    "internalType": "string",
                    "name": "fileUrl",
                    "type": "string"
                },
                {
                    "internalType": "uint256",
                    "name": "latitude",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "longitude",
                    "type": "uint256"
                }
            ],
            "internalType": "struct EventManager.Event[]",
            "name": "",
            "type": "tuple[]"
        }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{
                "internalType": "string",
                "name": "_email",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_password",
                "type": "string"
            }
        ],
        "name": "login",
        "outputs": [{
            "internalType": "bool",
            "name": "",
            "type": "bool"
        }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{
                "internalType": "string",
                "name": "_username",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_email",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_password",
                "type": "string"
            }
        ],
        "name": "signup",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];
const contractAddress = '0xd9145CCE52D386f254917e481eB44e9943F39138'; // Replace with your contract address

// Connect to an Ethereum node (Replace with your actual provider)
const web3 = new Web3(new Web3.providers.HttpProvider('https://eth-mainnet.g.alchemy.com/v2/-pWYYtxO4EGvuPdSxjRoK6_cHUWVgBkI'));
const contract = new web3.eth.Contract(abi, contractAddress); // Initialize the contract

app.use(cors());
app.use(bodyParser.json());

// Signup endpoint
app.post('/signup', async(req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        // Check if user already exists
        const userExists = await contract.methods.login(email, password).call({ from: '0xD5bb55207be4Ad31ee1cC67a5923744DE558f8aC' });
        if (userExists) {
            return res.status(409).json({ message: 'User already registered' });
        }

        // Register the user
        await contract.methods.signup(username, email, password).send({ from: '0xD5bb55207be4Ad31ee1cC67a5923744DE558f8aC' });
        res.status(201).json({ message: 'User signed up successfully' });
    } catch (error) {
        console.error('Error signing up user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Login endpoint
app.post('/login', async(req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const isAuthenticated = await contract.methods.login(email, password).call({ from: '0xYourAccountAddress' });
        if (isAuthenticated) {
            res.status(200).json({ message: 'Login successful' });
        } else {
            res.status(400).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Setup for file uploads using multer
const upload = multer({ dest: 'uploads/' });

// Handle adding a new event
app.post('/add-event', upload.single('file'), async(req, res) => {
    const { eventName, description, date, latitude, longitude } = req.body;
    const fileUrl = req.file ? `http://localhost:${PORT}/uploads/${req.file.filename}` : null;

    try {
        await contract.methods.createEvent(eventName, description, date, latitude, longitude, fileUrl).send({ from: '0xYourAccountAddress' });
        res.status(200).json({ message: 'Event added successfully' });
    } catch (error) {
        console.error('Error adding event:', error);
        res.status(500).json({ message: 'Error storing event on the blockchain' });
    }
});

// Fetch all events for the current user
app.get('/events', async(req, res) => {
    try {
        const events = await contract.methods.getEvents().call({ from: '0xYourAccountAddress' });
        res.json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Serve static files from the uploads directory
app.use('/uploads', express.static('uploads'));

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});