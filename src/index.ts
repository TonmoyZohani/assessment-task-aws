import { createUser, getUsers } from "./db/user";

export const handler = async (event: any) => {
  console.log("Event:", JSON.stringify(event, null, 2));
  const field = event.info.fieldName;

  if (field === "createUser") {
    return createUser(event.arguments.input);
  }

  if (field === "getUsers") {
    return getUsers(event.arguments);
  }

  throw new Error("Unknown field: " + field);
};
