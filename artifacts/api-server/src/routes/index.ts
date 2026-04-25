import { Router, type IRouter } from "express";
import healthRouter from "./health";
import incomeRouter from "./income";
import billsRouter from "./bills";
import arrearsRouter from "./arrears";
import tasksRouter from "./tasks";
import commsRouter from "./comms";
import weeksRouter from "./weeks";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(incomeRouter);
router.use(billsRouter);
router.use(arrearsRouter);
router.use(tasksRouter);
router.use(commsRouter);
router.use(weeksRouter);
router.use(dashboardRouter);

export default router;
