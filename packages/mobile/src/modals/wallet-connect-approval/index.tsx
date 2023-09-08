import React, { FunctionComponent, useLayoutEffect, useState } from "react";
import { registerModal } from "../base";
import { CardModal } from "../card";
import { Text, View } from "react-native";
import { useStyle } from "../../styles";
import { Button } from "../../components/button";
import { useStore } from "../../stores";
import { PermissionData } from "@keplr-wallet/background";
import { WCMessageRequester } from "../../stores/wallet-connect/msg-requester";
import { WCAppLogoAndName } from "../../components/wallet-connect";
import { WCV2MessageRequester } from "../../stores/wallet-connect-v2/msg-requester";

export const WalletConnectApprovalModal: FunctionComponent<{
  isOpen: boolean;
  close: () => void;
  id: string;
  data: PermissionData;
}> = registerModal(
  ({ id, data }) => {
    const {
      permissionStore,
      walletConnectStore,
      walletConnectV2Store,
    } = useStore();

    const [peerMeta, setPeerMeta] = useState<
      { name?: string; url?: string; icons?: string[] } | undefined
    >(undefined);

    useLayoutEffect(() => {
      if (data.origins.length !== 1) {
        throw new Error("Invalid origins");
      }

      if (WCMessageRequester.isVirtualSessionURL(data.origins[0])) {
        setPeerMeta(
          walletConnectStore.getSession(
            WCMessageRequester.getSessionIdFromVirtualURL(data.origins[0])
          )?.peerMeta || undefined
        );
      } else {
        walletConnectV2Store
          .getSessionMetadata(
            WCV2MessageRequester.getIdFromVirtualURL(data.origins[0])
          )
          .then((r) => setPeerMeta(r));
      }
    }, [data.origins, walletConnectStore, walletConnectV2Store]);

    const appName = peerMeta?.name || peerMeta?.url || "unknown";

    const style = useStyle();

    return (
      <CardModal title="Wallet Connect">
        <WCAppLogoAndName
          containerStyle={style.flatten(["margin-y-20"])}
          peerMeta={peerMeta}
        />
        <Text style={style.flatten(["margin-bottom-40", "text-center"])}>
          <Text
            style={style.flatten(["body1", "color-text-low", "font-semibold"])}
          >
            {appName}
          </Text>
          <Text style={style.flatten(["body1", "color-text-low"])}>
            {" is requesting to connect to your Keplr account on "}
          </Text>
          <Text
            style={style.flatten(["body1", "color-text-low", "font-semibold"])}
          >
            {data.chainIds.join(", ") + "."}
          </Text>
        </Text>
        <View style={style.flatten(["flex-row"])}>
          <Button
            containerStyle={style.get("flex-1")}
            text="Reject"
            mode="outline"
            color="danger"
            onPress={() => {
              permissionStore.reject(id);
            }}
          />
          <View style={style.get("width-page-pad")} />
          <Button
            containerStyle={style.get("flex-1")}
            text="Approve"
            onPress={() => {
              permissionStore.approve(id);
            }}
          />
        </View>
      </CardModal>
    );
  },
  {
    disableSafeArea: true,
  }
);