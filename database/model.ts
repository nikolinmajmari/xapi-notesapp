import Database from "./database.ts";

export class Model<T> {
  protected _id: number | undefined;
  get id(): number | undefined {
    return this._id;
  }

  constructor() {
    this._id = -1;
  }

  static fieldSep = "ŧ";
  static table = "model";
  static toLine<T extends Model<T>>(model: T): string {
    const fields = [];
    const source = {...model};
    for (const key in source) {
      fields.push(model[key]);
    }
    return fields.join(Model.fieldSep);
  }

  static fromLine<T extends Model<T>>(line: string, type: typeof Model): T {
    const instance: Model<T> = new type();
    line = line.replaceAll(`\\${type.fieldSep}`, type.fieldSep);
    const source: {[key: string]: any} = {...instance};
    let counter = 0;
    const fields = line.split(Model.fieldSep);
    for (const key in source) {
      if (fields.length > counter) {
        if (typeof source[key] == "number") {
          source[key] = parseInt(fields[counter]);
        } else {
          source[key] = fields[counter];
        }
      } else {
        break;
      }
      counter++;
    }
    Object.assign(instance, source);
    return instance as T;
  }
}
