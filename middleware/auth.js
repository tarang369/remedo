const jwt = require("jsonwebtoken");

const config = process.env;

const verifyToken = (req, res, next) => {
    const token = req.cookies.token || ''

    if(!token) {
        return res.status(403).redirect("/login");
    }
    try {
        const decoded = jwt.verify(token, config.TOKEN_KEY);
        req.user = decoded;
    } catch(err) {
        res.clearCookie('token');
        res.status(401).redirect('/login');
    }
    return next();
};

module.exports = verifyToken;