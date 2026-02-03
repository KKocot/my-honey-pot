// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { WorkerBeeError } from "./errors";
import { DataProvider } from "./DataProvider";
import type { ICommunity } from "./interfaces";

export class Community implements ICommunity {
  public readonly name: string;
  public readonly title: string;
  public readonly about: string;
  public readonly admins: string[];
  public readonly avatarUrl: string;
  public readonly creationDate: Date;
  public readonly subscribersCount: number;
  public readonly authorsCount: number;
  public readonly pendingCount: number;

  public constructor(communityName: string, dataProvider: DataProvider) {
    const communityData = dataProvider.getCommunity(communityName);
    if (!communityData) throw new WorkerBeeError("No community");
    this.name = communityData.name;
    this.title = communityData.title;
    this.about = communityData.about;
    this.admins = communityData.admins || [];
    this.avatarUrl = communityData.avatar_url;
    this.creationDate = new Date(`${communityData.created_at}Z`);
    this.subscribersCount = communityData.subscribers;
    this.authorsCount = communityData.num_authors;
    this.pendingCount = communityData.num_pending;

  }

  /**
   * Get standard WordPress slug. It treats community as category.
   */
  public getSlug(): string {
    return this.title.toLowerCase().replace(/\s+/g, "-");
  }
}
