import { Router, type IRouter } from "express";
import healthRouter from "./health";
import registrantsRouter from "./registrants";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/registrants", registrantsRouter);
router.use("/admin", adminRouter);

export default router;
