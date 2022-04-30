import { SessionAuth } from "../deps.ts";
import { User } from "../models/user.ts";

const manager =  new SessionAuth<User>();

/// todo add configuration here 



export default manager;