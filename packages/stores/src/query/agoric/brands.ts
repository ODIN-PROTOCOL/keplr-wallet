import { ObservableChainQuery } from "../chain-query";
import { VstorageResult } from "./types";
import { ChainGetter } from "../../common";
import { makeObservable } from "mobx";
import { KVStore } from "@keplr-wallet/common";

export class ObservableQueryBrands extends ObservableChainQuery<VstorageResult> {
  constructor(kvStore: KVStore, chainId: string, chainGetter: ChainGetter) {
    super(
      kvStore,
      chainId,
      chainGetter,
      `/agoric/vstorage/data/published.agoricNames.brand`
    );

    makeObservable(this);
  }

  get data(): { body: any; slots: any } | undefined {
    if (!this.response) return undefined;

    const { value } = this.response.data;
    const parsedValue = JSON.parse(value);

    const latestValueStr =
      "values" in parsedValue
        ? parsedValue.values[parsedValue.values.length - 1]
        : parsedValue;

    return JSON.parse(latestValueStr);
  }
}
