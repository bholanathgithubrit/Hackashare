const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const Web3 = require('web3'); // Updated import for Web3
const { HttpProvider } = require('web3-providers-http');
const { Transaction } = require('@ethereumjs-tx'); // Updated import for Transaction
const Common = require('@ethereumjs-common').default; // Correct import for Common

const app = express();
const PORT = 5000;

// Your contract ABI
const abi = [{
        "inputs": [{
                "internalType": "string",
                "name": "_lat",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_lng",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_description",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_filePath",
                "type": "string"
            }
        ],
        "name": "addLocation",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [{
            "indexed": true,
            "internalType": "string",
            "name": "fileHash",
            "type": "string"
        }],
        "name": "NewFile",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [{
            "indexed": true,
            "internalType": "uint256",
            "name": "locationId",
            "type": "uint256"
        }],
        "name": "NewLocation",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [{
            "indexed": true,
            "internalType": "address",
            "name": "user",
            "type": "address"
        }],
        "name": "NewUser",
        "type": "event"
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
        "name": "signUp",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{
                "internalType": "string",
                "name": "_fileHash",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_filePath",
                "type": "string"
            }
        ],
        "name": "uploadFile",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{
            "internalType": "string",
            "name": "",
            "type": "string"
        }],
        "name": "files",
        "outputs": [{
                "internalType": "string",
                "name": "hash",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "filePath",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "locationCounter",
        "outputs": [{
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
        }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
        }],
        "name": "locations",
        "outputs": [{
                "internalType": "uint256",
                "name": "id",
                "type": "uint256"
            },
            {
                "internalType": "string",
                "name": "lat",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "lng",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "description",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "filePath",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "timestamp",
                "type": "uint256"
            }
        ],
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
            "internalType": "address",
            "name": "",
            "type": "address"
        }],
        "name": "users",
        "outputs": [{
                "internalType": "string",
                "name": "username",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "email",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "password",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];
const contractAddress = '0xD7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771B'; // Replace with your contract address

// Initialize Web3 and contract instance
const provider = new Web3.providers.HttpProvider('https://eth-mainnet.g.alchemy.com/v2/-pWYYtxO4EGvuPdSxjRoK6_cHUWVgBkI');
const web3 = new Web3(provider);
const contract = new web3.eth.Contract(abi, contractAddress);

// Replace with your private key (DO NOT expose this key publicly or commit it to code repositories)
const privateKey = Buffer.from('830b8bcf30fcc72af1459ad32a955b9f0d80d3e56e992e96e85ee99315380b52', 'hex');
const senderAddress = '0xD5bb55207be4Ad31ee1cC67a5923744DE558f8aC'; // Replace with your address

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Setup for file uploads using multer
const upload = multer({ dest: 'uploads/' });

// Utility function to sign and send transactions
async function signAndSendTransaction(txData) {
    const common = new Common({ chain: 'mainnet' }); // Specify the network
    const tx = Transaction.fromTxData(txData, { common });
    const signedTx = tx.sign(privateKey);
    const serializedTx = signedTx.serialize();

    return web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'));
}

// Signup endpoint
app.post('/signup', async(req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const txData = {
            to: contractAddress,
            data: contract.methods.signUp(username, email, password).encodeABI(),
            gas: await contract.methods.signUp(username, email, password).estimateGas({ from: senderAddress }),
            gasPrice: await web3.eth.getGasPrice(),
            nonce: await web3.eth.getTransactionCount(senderAddress),
        };

        await signAndSendTransaction(txData);
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
        const isAuthenticated = await contract.methods.login(email, password).call({ from: senderAddress });
        if (isAuthenticated) {
            res.status(200).json({ message: 'Login successful' });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Add Location endpoint
app.post('/add-location', upload.single('file'), async(req, res) => {
    const { lat, lng, description, filePath } = req.body;

    try {
        const txData = {
            to: contractAddress,
            data: contract.methods.addLocation(lat, lng, description, filePath).encodeABI(),
            gas: await contract.methods.addLocation(lat, lng, description, filePath).estimateGas({ from: senderAddress }),
            gasPrice: await web3.eth.getGasPrice(),
            nonce: await web3.eth.getTransactionCount(senderAddress),
        };

        await signAndSendTransaction(txData);
        res.status(200).json({ message: 'Location added successfully' });
    } catch (error) {
        console.error('Error adding location:', error);
        res.status(500).json({ message: 'Error storing location on the blockchain' });
    }
});

// Fetch all locations
app.get('/locations', async(req, res) => {
    try {
        const locationCounter = await contract.methods.locationCounter().call();
        const locations = [];

        for (let i = 0; i < locationCounter; i++) {
            const location = await contract.methods.locations(i).call();
            locations.push(location);
        }

        res.json(locations);
    } catch (error) {
        console.error('Error fetching locations:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Serve static files from the uploads directory
app.use('/uploads', express.static('uploads'));

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});