const { verifyToken, decodeToken } = require('../Utils/jwtUtil');
const { getUser } = require('../controllers/UserController');

async function authMiddleware(req, res, next) {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'No authentication token found' });
        }


        const isValid = await verifyToken(token);
        if (!isValid) {
            return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
        }


        const mail = decodeToken(token).mail;

        const user = await getUser(mail);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }


        user.password = undefined;


        // req.user = user;


        next();
    } catch (err) {
        console.error("Error fetching user:", err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}

module.exports = { authMiddleware };
