import { Router, type IRouter } from "express";
import healthRouter from "./health";
import incomeRouter from "./income";
import incomeEntriesRouter from "./income-entries";
import billsRouter from "./bills";
import arrearsRouter from "./arrears";
import tasksRouter from "./tasks";
import commsRouter from "./comms";
import weeksRouter from "./weeks";
import dashboardRouter from "./dashboard";
import exportRouter from "./export";
import importRouter from "./import";
import gigRouter from "./gig";
import budgetRouter from "./budget";
import scenariosRouter from "./scenarios";
import shoppingRouter from "./shopping";

const router: IRouter = Router();

router.use(healthRouter);
router.use(incomeRouter);
router.use(incomeEntriesRouter);
router.use(billsRouter);
router.use(arrearsRouter);
router.use(tasksRouter);
router.use(commsRouter);
router.use(weeksRouter);
router.use(dashboardRouter);
router.use(exportRouter);
router.use(importRouter);
router.use(gigRouter);
router.use(budgetRouter);
router.use(scenariosRouter);
router.use(shoppingRouter);

export default router;
