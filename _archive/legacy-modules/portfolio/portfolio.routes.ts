import { createCrudController, createCrudRouter, createCrudService } from "../../common/factories/crudFactory";
import { Portfolio, IPortfolio } from "./portfolio.model";
import { createPortfolioSchema, updatePortfolioSchema } from "./portfolio.validation";

const service = createCrudService<IPortfolio>(Portfolio);
const controller = createCrudController<IPortfolio>(service, ["title", "client", "category"], "portfolio");

export default createCrudRouter<IPortfolio>(controller, {
  resource: "portfolio",
  createSchema: createPortfolioSchema,
  updateSchema: updatePortfolioSchema,
});
