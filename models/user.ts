import {Model} from "../database/model.ts";
import { AuthenticableInterface } from "../deps.ts";

export class User extends Model<User> implements AuthenticableInterface {
  static table = "user";
  constructor(username:string="unknown"){
    super();
    this.username = username;
  }
   username: string;
   password: string | undefined;
   firstName: string | undefined;
   lastName: string | undefined;
}