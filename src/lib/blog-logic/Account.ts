import { WorkerBeeError } from "./errors";
import { DataProvider } from "./DataProvider";
import type { IAccount } from "./interfaces";

export class Account implements IAccount {
  public readonly name: string;
  public readonly creationDate: Date;
  public readonly postCount: number;
  public readonly lastActivity: Date;
  public readonly registeredDate: Date;
  public readonly description: string;
  public readonly avatar: string;

  public constructor(accountName: string, dataProvider: DataProvider) {
    const accountData = dataProvider.getAccount(accountName);
    if(!accountData) throw new WorkerBeeError("No account");
    this.name = accountData.name ?? accountName;
    const metadata = accountData.posting_json_metadata ? JSON.parse(accountData.posting_json_metadata) : {};
    this.avatar = metadata?.profile?.profile_image || "";
    this.creationDate = new Date(`${accountData.created ?? ""}Z`);
    this.postCount = 0; // In this API not available.
    this.lastActivity = new Date(); // In this API not available.
    this.registeredDate = new Date(`${accountData.created ?? ""}Z`);
    this.description = metadata?.about || "";
  }

  /**
   * Get standard WordPress slug for account.
   */
  public getSlug(): string {
    return this.name;
  }
}
