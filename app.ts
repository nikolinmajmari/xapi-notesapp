import {Application} from "./deps.ts";
import notesRouter from "./routes/notes.ts";
import authRouter from "./routes/auth.ts";
import {engines, staticMiddleware} from "./deps.ts";
import {xapiDefaultFileManager} from "./deps.ts";
import appSession from "./session.ts";
import authManager from "./auth/config.ts";

const app = new Application();
app.use(async (ctx, next) => {
  const now = Date.now();
  console.log("start time for request ", now);
  await next();
  const end = Date.now();
  console.log("end time req ", end, "  difference ", end - now);
});

/// add session

app.use(appSession.inject());
app.setViewEngine(engines.etaEngine.configure({cache: false}));
app.use(
  staticMiddleware({
    path: "/assets",
    urlMapper: (e) => e.replace("/assets", ""),
  })
);
app.use(authManager.authMiddleware());

app.use(
  "/filemanager",
  xapiDefaultFileManager
    .config({
      path: "/private_uploads",
      middlewares: [],
      middlewarePath: "/filemanager",
    })
    .init()
);
app.use("/auth", authRouter);
app.use("/notes",[authManager.ensureAuthenticated(), notesRouter]);
app.use(async (ctx) => {
  console.log("not found");
  await ctx.res.notFound();
});
app.listen(8000);
