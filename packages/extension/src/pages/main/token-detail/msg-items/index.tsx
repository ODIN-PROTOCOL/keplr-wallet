import React, { FunctionComponent } from "react";
import { MsgHistory } from "../types";
import { MsgRelationSend } from "./send";
import { MsgRelationReceive } from "./receive";
import { MsgRelationDelegate } from "./delegate";
import { MsgRelationUndelegate } from "./undelegate";
import { MsgRelationMergedClaimRewards } from "./merged-claim-rewards";
import { MsgRelationIBCSend } from "./ibc-send";
import { MsgRelationIBCSendRefunded } from "./ibc-send-refunded";
import { MsgRelationIBCSendReceive } from "./ibc-send-receive";
import { MsgRelationVote } from "./vote";

export const MsgItemRender: FunctionComponent<{
  msg: MsgHistory;
  prices?: Record<string, Record<string, number | undefined> | undefined>;
  targetDenom: string;
}> = ({ msg, prices, targetDenom }) => {
  switch (msg.relation) {
    case "send": {
      return (
        <MsgRelationSend msg={msg} prices={prices} targetDenom={targetDenom} />
      );
    }
    case "receive": {
      return (
        <MsgRelationReceive
          msg={msg}
          prices={prices}
          targetDenom={targetDenom}
        />
      );
    }
    case "ibc-send": {
      return (
        <MsgRelationIBCSend
          msg={msg}
          prices={prices}
          targetDenom={targetDenom}
        />
      );
    }
    case "ibc-send-receive": {
      return (
        <MsgRelationIBCSendReceive
          msg={msg}
          prices={prices}
          targetDenom={targetDenom}
        />
      );
    }
    case "ibc-send-refunded": {
      return (
        <MsgRelationIBCSendRefunded
          msg={msg}
          prices={prices}
          targetDenom={targetDenom}
        />
      );
    }
    case "delegate": {
      return (
        <MsgRelationDelegate
          msg={msg}
          prices={prices}
          targetDenom={targetDenom}
        />
      );
    }
    case "undelegate": {
      return (
        <MsgRelationUndelegate
          msg={msg}
          prices={prices}
          targetDenom={targetDenom}
        />
      );
    }
    case "vote": {
      return (
        <MsgRelationVote msg={msg} prices={prices} targetDenom={targetDenom} />
      );
    }
    case "custom/merged-claim-rewards": {
      return (
        <MsgRelationMergedClaimRewards
          msg={msg}
          prices={prices}
          targetDenom={targetDenom}
        />
      );
    }
  }

  // TODO: 임시적인 alternative?
  return null;
};