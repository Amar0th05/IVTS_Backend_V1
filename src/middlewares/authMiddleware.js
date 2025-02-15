const {verifyToken, decodeToken} = require('../Utils/jwtUtil');
const { getUser } = require('../controllers/UserController');

async function authMiddleware(req, res, next) {

    try{
        const token=req.headers.authorization?.split(' ')[1];

        if(!token){
            return res.status(401).json({message:'no auth token found'});
        }

        const isValid=verifyToken(token);
        if(!isValid){
            return res.status(401).json({message:'UNAUTHORIZED : invalid token'});
        }
        const mail=decodeToken(token);
        const user=await getUser(mail);
        user.password="<PASSWORD>";
        req.user=user;

        next();
    }catch(err){
        console.error("error fetching user : ",err);
        return res.status(500).json({message:'INTERNAL SERVER ERROR'});
    }

}

module.exports={ authMiddleware };