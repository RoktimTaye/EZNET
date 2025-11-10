const { body, validationResult } = require("express-validator");

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

const registerValidationRules = () => {
    return [
        body("name").notEmpty().withMessage("Name is required"),
        body("email").isEmail().withMessage("Provide a valid email"),
        body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
        body("age").isNumeric().withMessage("Age must be a number"),
        body("gender").notEmpty().withMessage("Gender is required"),
    ];
};

const loginValidationRules = () => {
    return [
        body("email").isEmail().withMessage("Provide a valid email"),
        body("password").notEmpty().withMessage("Password is required"),
    ];
};

module.exports = {
    validate,
    registerValidationRules,
    loginValidationRules,
};
