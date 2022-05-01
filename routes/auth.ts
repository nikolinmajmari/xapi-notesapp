// deno-lint-ignore-file
import {Router} from "../deps.ts";
import { User } from "../models/user.ts";
import db from "../db.ts";
import authManager from "../auth/config.ts";
import { FunctionHandler } from "../../../xapi/app/lib/router.ts";

const router = new Router();

router.use(async (ctx, next) => {
  console.log(ctx.req.headers.get("Content-type"));
  await next();
});
router.use(["/login","/signup"],async (ctx,next)=>{
  if(authManager.eject(ctx)?.isAuthenticated()){
    return await ctx.res.redirect("/notes");
  }
  await next();
});
router.get("/login", async (ctx, next) => {
  return await ctx.res.render("./login.html");
});
router.post("/login", [
  async (ctx, next) => {
    await ctx.req.body.parseForm();
    next();
  },
  async (ctx, next) => {
    const form = ctx.req.body.form;
    const username = form.get("username");
    const password = form.get("password");
    console.log(username,password);
    const user = (await db.load<User>(User,(u)=>u.username==username && u.password == password)).findLast(()=>true);
    if(user==undefined){
      return await ctx.res.redirect("/auth/login");
    }
    await authManager.eject(ctx)?.authenticate(user,["admin"]);
    await ctx.res.redirect("/notes");
  },
]);
router.get("/signup",async (ctx,next)=>{
  await ctx.res.render("./signup.html");
});
router.post("/signup",async(ctx,next)=>{
  console.log("hey papa");
  const form = await ctx.req.body.parseForm();
  console.log("parsed already");
  const {name,surname,username,password,retypePassword} = {
    name:form.get("name"),
    surname:form.get("surname"),
    username:form.get("username"),
    password:form.get("password"),
    retypePassword:form.get("retypePassword")};
  const errors = {};
  const user = new User();
  user.firstName = name!;
  user.lastName = surname!;
  user.password = password!;
  user.username = username!;
  await db.createModel(User,user);
  await ctx.res.redirect("/auth/login");
});
router.use("/logout",async (ctx,next)=>{
  await authManager.eject(ctx)?.destroy();
  await ctx.res.redirect("/auth/login");
})


export default router;
