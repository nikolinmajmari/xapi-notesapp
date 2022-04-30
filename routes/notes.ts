// deno-lint-ignore-file
import {Router, XapiFormDataFiles} from "../deps.ts";
import db from "../db.ts";
import {Note} from "../models/note.ts";
import {configure, renderFile} from "https://deno.land/x/eta/mod.ts";
configure({views: Deno.cwd() + "/views"});
import appSession from "../session.ts";

const router = new Router();

/**
 * return all notes
 */
router.get("/", async (ctx, next) => {
  const notes = await db.load(Note);
  const session = appSession.of(ctx);
  try {
    const cnt = parseInt((await session?.get("cnt")) ?? "0");
    await session?.set("cnt", (cnt + 1).toString());
    console.log(cnt);
    await session?.flush();
  } catch (e) {
    console.log(e);
  }
  await ctx.res.render("./notes/index.html.eta", {
    notes: notes,
  });
});

router.get("/new", async (ctx, next) => {
  await ctx.res.render("./notes/new.html");
});

router.post("/new", async (ctx, next) => {
  try {
    const form = await ctx.req.body.parseMultipartFormData();
    const {title, content}: {[key: string]: string} = {...form.fields};
    const _files = form.files ?? [];
    let file = "";
    for (const _file of _files) {
      if (_file.name == "file") {
        file = "user_1_" + Date.now().toString() + "_" + _file.originalName;
        const fp = await Deno.open("./private_uploads/notes/" + file, {
          write: true,
          create: true,
        });
        if (_file.content != undefined) {
          await fp.writable.getWriter().write(_file.content);
        } else {
          const source = await Deno.open(_file.filename!, {read: true});
          await source.readable.pipeTo(fp.writable);
        }
        break;
      }
    }
    const note = new Note();
    note.title = title;
    note.content = content;
    note.file = file;
    await db.createModel(Note, note);
    await ctx.res.redirect("/notes");
  } catch (e) {
    await ctx.res.statusBadRequest().sent();
  }
});

router.get("/new_other", async (ctx, next) => {
  await ctx.res.render("./notes/new.html");
});
router.post("/new_other", async (ctx, next) => {
  try {
    const note = new Note();
    const form = await ctx.req.body.parseMultipartFormData();
    const {title, content}: {[key: string]: string} = {...form.fields};
    const _files = new XapiFormDataFiles(form.files!);
    const file = _files.get("file");
    if (file != null) {
      const filePath =
        "./private_uploads/notes/user_1_" +
        Date.now().toString() +
        "_" +
        file.originalName;
      await file.save(filePath);
      note.file = filePath;
    }
    note.title = title;
    note.content = content;
    await db.createModel(Note, note);
    await ctx.res.redirect("/notes");
  } catch (e) {
    await ctx.res.statusBadRequest().sent();
  }
});

/**
 * return a specific note
 */

router.use("/:id(\\d+)", async (ctx, next) => {
  const {id} = ctx.req.params;
  const note = (await db.load<Note>(Note, (e) => e.id == id)).findLast(
    (e) => true
  );
  if (note == undefined) {
    return await ctx.res.notFound();
  }
  ctx.attribs.note = note;
  await next();
});

router.get("/:id(\\d+)", async (ctx, next) => {
  const note = ctx.attribs.note;
  await ctx.res.render("./notes/edit.html.eta", {
    title: note.title,
    content: note.content,
    file: note.file,
  });
});

/**
 * update specific note
 */
router.post("/:id(\\d+)", async (ctx, next) => {
  const note: Note = ctx.attribs.note;
  try {
    const form = await ctx.req.body.parseMultipartFormData();
    const {title, content} = form.fields;
    if (form.files != undefined) {
      const xapiFiles = new XapiFormDataFiles(form.files);
      const file = xapiFiles.get("file");
      if (file != null) {
        const filePath =
          "./private_uploads/notes/user_1_" +
          Date.now().toString() +
          "_" +
          file.originalName;
        note.file = filePath;
        file.save(filePath);
      }
    }
    note.title = title;
    note.content = content;
    await db.updateModel(Note, note);
    await ctx.res.redirect("/notes/" + note.id);
  } catch (e) {
    await ctx.res.statusBadRequest().sent();
  }
});

/**
 * delete specific note
 */
router.delete("/:id(\\d+)", async (ctx, next) => {
  next();
});

export default router;
