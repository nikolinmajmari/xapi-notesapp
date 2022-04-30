// deno-lint-ignore-file
import {Router} from "../deps.ts";

const router = new Router();
router.use(async (ctx, next) => {
  console.log(ctx.req.headers.get("Content-type"));
  await next();
});

router.get("/login", async (ctx, next) => {
  return await ctx.res.render("./login.eta");
});

router.post("/login", [
  async (ctx, next) => {
    await ctx.req.body.parseMultipartFormData();
    next();
  },
  async (ctx, next) => {
    const form = ctx.req.body.formData;
    console.log(ctx.req.body);
    for (const file of form.files ?? []) {
      const name = file.originalName;
      const fp = await Deno.open(file.filename!, {read: true});
      const uploaded = await Deno.open(
        `${Deno.cwd()}/private_uploads/${name}`,
        {
          write: true,
          create: true,
        }
      );
      await fp.readable.pipeTo(uploaded.writable);
    }
    ctx.res.text("200");
  },
]);

export default router;
