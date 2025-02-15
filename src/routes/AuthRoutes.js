const {login} = require("../controllers/authController");
const {refreshToken, refresh} = require("../Utils/jwtUtil");
const {registerUser} = require("../controllers/UserController");

const authRouter = require("express").Router();

authRouter.post("/login",login);
authRouter.post("/register",registerUser);
authRouter.get("/token/refresh",refresh);

module.exports = {authRouter};