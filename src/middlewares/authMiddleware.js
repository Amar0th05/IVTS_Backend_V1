const { verifyToken, decodeToken } = require('../Utils/jwtUtil');
const { getUser } = require('../controllers/UserController');

async function authMiddleware(req, res, next) {
    try {

        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Invalid token format' });
        }


        const token = authHeader.split(' ')[1];


        const isValid = await verifyToken(token);
        if (!isValid) {
            return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
        }


        let mail;
        try {
            mail = decodeToken(token).mail;
        } catch (err) {
            return res.status(401).json({ message: 'Invalid token' });
        }


        const user = await getUser(mail).catch(err => {
            console.error("Database error:", err);
            throw new Error("Database error");
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }


        const { password, ...userWithoutPassword } = user;


        req.user = userWithoutPassword;


        next();
    } catch (err) {
        console.error("Error in authMiddleware:", err);
        return res.status(500).json({ message: err.response?.data?.message || err.message || "Internal Server Error"  });
    }
}

module.exports = { authMiddleware };