// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { Comment } from "./Comment";
import { DataProvider } from "./DataProvider";
import type { IPostCommentIdentity, IReply } from "./interfaces";

export class Reply extends Comment implements IReply {
  public parent: IPostCommentIdentity;
  public topPost: IPostCommentIdentity;

  public constructor(
    authorPermlink: IPostCommentIdentity,
    dataProvider: DataProvider,
    topPost: IPostCommentIdentity
  ) {
    super(authorPermlink, dataProvider);
    const reply = dataProvider.getComment(authorPermlink);

    this.parent = {author: reply?.parent_author || "", permlink: reply?.parent_permlink || ""};
    this.topPost = topPost;
  }
}
