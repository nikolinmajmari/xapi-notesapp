import Database from "./database/database.ts";
import {Note} from "./models/note.ts";
import {User} from "./models/user.ts";

const db = new Database();
db.register(User);
db.register(Note);
export default db;
