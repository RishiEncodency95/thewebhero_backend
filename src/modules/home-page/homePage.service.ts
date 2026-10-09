import { HomePage, IHomePage } from "./homePage.model";
import { UpdateHomePageInput } from "./homePage.validation";

export const homePageService = {
  async get(): Promise<IHomePage> {
    let page = await HomePage.findOne();
    if (!page) page = await HomePage.create({ hero: { title: "Welcome to TheWebHero" } });
    return page;
  },

  async update(data: UpdateHomePageInput): Promise<IHomePage> {
    const page = await this.get();
    Object.assign(page, data);
    await page.save();
    return page;
  },
};
