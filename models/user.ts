import {Model} from "../database/model.ts";

export class User extends Model<User> {
  static table = "user";
  private username: string | undefined;
  private password: string | undefined;
  private firstName: string | undefined;
  private lastName: string | undefined;
}
