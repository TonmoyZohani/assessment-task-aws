"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const user_1 = require("./db/user");
const handler = async (event) => {
    console.log("Event:", JSON.stringify(event, null, 2));
    const field = event.info.fieldName;
    if (field === "createUser") {
        return (0, user_1.createUser)(event.arguments.input);
    }
    if (field === "getUsers") {
        return (0, user_1.getUsers)(event.arguments);
    }
    throw new Error("Unknown field: " + field);
};
exports.handler = handler;
