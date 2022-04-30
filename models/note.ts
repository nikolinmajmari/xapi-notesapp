import {Model} from "../database/model.ts";

export class Note extends Model<Note> {
  static table = "note";
  title: string;
  content: string;
  user: number;
  file: string | null = null;

  constructor() {
    super();
    this.title = "";
    this.content = "";
    this.user = -1;
    this.file = "";
  }
}
