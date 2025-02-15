const jwt = require('jsonwebtoken');
require('dotenv').config();

function generateToken(payload) {
    try {

        if (typeof payload !== 'object' || payload === null) {
            throw new Error('Payload must be an object');
        }


        const expiresIn = process.env.JWT_SECRET_EXPIRATION_TIME || '1h';


        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });

        return token;
    } catch (error) {
        console.error('Error generating token:', error);
        throw error;
    }
}


function decodeToken(token) {
    try {
        return jwt.decode(token);
    } catch (err) {
        console.error("Error decoding token:", err);
        return null;
    }
}

function verifyToken(token) {
    try {

        if (!token || typeof token !== 'string') {
            console.error("Invalid token format:", token);
            return null;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded;
    } catch (err) {
        console.error("Error verifying token:", err);
        return null;
    }
}

function refreshToken(token) {
    try {

        if (!token || typeof token !== 'string') {
            console.error("Invalid token format:");
            return null;
        }


        const decoded = verifyToken(token);
        if (decoded) {

            return generateToken({ mail: decoded.mail });
        }
    } catch (err) {
        console.error("Error refreshing token:", err);
    }
    return null;
}


function refresh(req, res) {

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authorization header is missing or invalid.' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Token is missing.' });
    }


    const newToken = refreshToken(token);
    if (newToken) {
        res.setHeader('Authorization', `Bearer ${newToken}`);
        return res.status(200).json({ message: 'Token refreshed successfully.', token: newToken });
    } else {
        return res.status(401).json({ message: 'Invalid token or failed to refresh.' });
    }
}

module.exports = {
    generateToken,
    verifyToken,
    decodeToken,
    refreshToken,
    refresh,
};