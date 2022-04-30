import {Model} from "./model.ts";

export default class Database {
  private path: string;
  private models: typeof Model[] = [];
  private records: _DB[] | undefined;
  private autoIncrements = [];
  constructor() {
    this.path = "./database/store";
    this.register(_DB);
  }

  configure(path: string) {
    this.path = path;
    return this;
  }

  async refreshAutoIncrement() {
    const increments = await this.load<_DB>(_DB);
    for (const model of this.models) {
      if (increments.findIndex((e: _DB) => e.table == model.table) == -1) {
        const _db = new _DB();
        _db.table = model.table;
        _db.idCount = 0;
        increments.push(_db);
      }
    }
    await this.save(_DB, increments);
  }

  async incrementNewIndex(model: typeof Model): Promise<void> {
    this.records?.forEach((record) => {
      if (record.table == model.table) {
        record.idCount = parseInt(record.idCount.toString()) + 1;
        return;
      }
    });
    await this.save(_DB, this.records!);
  }

  async getNewIndex(model: typeof Model): Promise<number> {
    if (this.records == undefined) {
      this.records = await this.load<_DB>(_DB);
    }
    const filtred = this.records!.filter((e) => e.table == model.table).map(
      (e) => e.idCount
    );
    if (filtred.length == 0) {
      throw "Model not registered";
    } else {
      return this.records!.filter((e) => e.table == model.table).map(
        (e) => e.idCount
      )[0];
    }
  }

  async updateNewIndex(model: typeof Model): Promise<void> {
    const increments = await this.load<_DB>(_DB);
    increments.forEach((inc) => {
      if (inc.table == model.table) {
        inc.idCount = inc.idCount + 1;
      }
    });
    await this.save(_DB, increments);
  }

  async save<T extends Model<T>>(
    type: typeof Model,
    models: T[]
  ): Promise<void> {
    const text = models
      .map((e) => {
        let line = type.toLine<T>(e);
        line = line.replaceAll("\n", "\\n");
        return line;
      })
      .join("\n");
    await Deno.writeTextFile(this.path + "/" + type.table, text, {
      create: true,
    });
  }

  async load<T extends Model<T>>(
    type: typeof Model,
    condition: ((item: T) => boolean) | undefined = (e) => true
  ): Promise<T[]> {
    const text = await Deno.readTextFileSync(this.path + "/" + type.table);
    const models = text
      .split("\n")
      .filter((e) => e != "")
      .map((val) => {
        return type.fromLine<T>(val.replaceAll("\\n", "\n"), type);
      });
    return models.filter(condition);
  }

  async updateModel<T extends Model<T>>(
    type: typeof Model,
    model: T
  ): Promise<void> {
    const models = await this.load<T>(type);
    const index = models.findLastIndex((e) => e.id == model.id);
    models[index] = model;
    await this.save(type, models);
  }

  async createModel<T extends Model<T>>(
    type: typeof Model,
    model: T
  ): Promise<void> {
    const data = await this.load<T>(type);
    const index = await this.getNewIndex(type);
    data.push({...model, _id: index});
    await this.save(type, data);
    await this.incrementNewIndex(type);
  }

  async deleteModel(type: typeof Model, model: Model<any>): Promise<void> {}

  async register(model: typeof Model) {
    this.models.push(model);
    const fp = await Deno.open(this.path + "/" + model.table);
    fp.close();
    await this.refreshAutoIncrement();
    return this;
  }
}

class _DB extends Model<_DB> {
  static table = "_db";
  table: string | undefined;
  idCount = 0;
}
