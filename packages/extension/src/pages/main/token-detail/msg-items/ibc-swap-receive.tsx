import React, { FunctionComponent, useMemo } from "react";
import { MsgHistory } from "../types";
import { observer } from "mobx-react-lite";
import { useStore } from "../../../../stores";
import { CoinPretty } from "@keplr-wallet/unit";
import { MsgItemBase } from "./base";
import { ItemLogo } from "./logo";
import { ChainInfo } from "@keplr-wallet/types";
import { ChainImageFallback } from "../../../../components/image";
import { isValidCoinStr, parseCoinStr } from "@keplr-wallet/common";

export const MsgRelationIBCSwapReceive: FunctionComponent<{
  msg: MsgHistory;
  prices?: Record<string, Record<string, number | undefined> | undefined>;
  targetDenom: string;
}> = observer(({ msg, prices, targetDenom }) => {
  const { chainStore } = useStore();

  const chainInfo = chainStore.getChain(msg.chainId);

  const sendAmountPretty = useMemo(() => {
    const currency = chainInfo.forceFindCurrency(targetDenom);

    const receives = msg.meta["receives"];
    if (
      receives &&
      Array.isArray(receives) &&
      receives.length > 0 &&
      typeof receives[0] === "string"
    ) {
      for (const coinStr of receives) {
        if (isValidCoinStr(coinStr as string)) {
          const coin = parseCoinStr(coinStr as string);
          if (coin.denom === targetDenom) {
            return new CoinPretty(currency, coin.amount);
          }
        }
      }
    }

    return new CoinPretty(currency, "0");
  }, [chainInfo, msg.meta, targetDenom]);

  const sourceChain: ChainInfo | undefined = (() => {
    if (!msg.ibcTracking) {
      return undefined;
    }

    try {
      if (msg.ibcTracking.paths.length > 0) {
        const path = msg.ibcTracking.paths[0];
        if (!path.chainId) {
          return undefined;
        }
        if (!chainStore.hasChain(path.chainId)) {
          return undefined;
        }
        return chainStore.getChain(path.chainId);
      }

      return undefined;
    } catch (e) {
      console.log(e);
      return undefined;
    }
  })();

  return (
    <MsgItemBase
      logo={
        <ItemLogo
          center={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="none"
              viewBox="0 0 16 16"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.87"
                d="M13 3L3 13m0 0h7.5M3 13V5.5"
              />
            </svg>
          }
          deco={
            sourceChain ? (
              <ChainImageFallback chainInfo={sourceChain} size="0.875rem" />
            ) : undefined
          }
        />
      }
      chainId={msg.chainId}
      title="Swap Completed"
      amount={sendAmountPretty}
      prices={prices || {}}
      targetDenom={targetDenom}
    />
  );
});