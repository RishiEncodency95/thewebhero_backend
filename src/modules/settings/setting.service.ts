import { Setting, ISetting } from "./setting.model";
import { UpdateSettingInput } from "./setting.validation";

export const settingService = {
  // Site settings is a singleton - there's exactly one document, created lazily.
  async get(): Promise<ISetting> {
    let setting = await Setting.findOne();
    if (!setting) setting = await Setting.create({});
    return setting;
  },

  async update(data: UpdateSettingInput): Promise<ISetting> {
    const setting = await this.get();
    Object.assign(setting, data);
    await setting.save();
    return setting;
  },
};
