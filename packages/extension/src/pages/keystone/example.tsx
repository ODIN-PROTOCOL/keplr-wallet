import { MsgSend } from "@keplr-wallet/proto-types/cosmos/bank/v1beta1/tx";
import {
  AuthInfo,
  TxBody,
  TxRaw,
} from "@keplr-wallet/proto-types/cosmos/tx/v1beta1/tx";
import { PubKey } from "@keplr-wallet/proto-types/cosmos/crypto/secp256k1/keys";
import React, { useCallback } from "react";
import { Button } from "reactstrap";
import { useStore } from "../../stores";
import Long from "long";
import { SignMode } from "@keplr-wallet/proto-types/cosmos/tx/signing/v1beta1/signing";
import { Hash, PrivKeySecp256k1, PubKeySecp256k1 } from "@keplr-wallet/crypto";
import { BroadcastMode, EthSignType, StdSignature } from "@keplr-wallet/types";

export function KeystoneExamplePage() {
  const { chainStore, accountStore } = useStore();

  const signDirect = useCallback(async () => {
    const chain = "osmosis";
    const info = {
      osmosis: {
        toAddr: "osmo1ptq7fgx0cgghlpjsvarr5kznlkj3h7tmgr0p4d",
      },
    };
    const toAddr = info[chain].toAddr;
    const current = chainStore.current;
    const accountInfo = accountStore.getAccount(current.chainId);
    console.log(current.chainId, accountInfo.bech32Address);
    if (!current.chainId || !accountInfo.bech32Address) {
      console.log("Try again!");
      return;
    }

    const feeCurrency = current.feeCurrencies[0];
    const currency = current.currencies[0];

    const account = await fetch(
      `${current.rest}/cosmos/auth/v1beta1/accounts/${accountInfo.bech32Address}`
    )
      .then((e) => e.json())
      .then((e) => e.account);
    console.log(account);

    const signRes = await window.keplr?.signDirect(
      current.chainId,
      accountInfo.bech32Address,
      {
        bodyBytes: TxBody.encode({
          messages: [
            {
              typeUrl: "/cosmos.bank.v1beta1.MsgSend",
              value: MsgSend.encode({
                fromAddress: accountInfo.bech32Address,
                toAddress: toAddr,
                amount: [
                  {
                    denom: currency.coinMinimalDenom,
                    amount: "10000",
                  },
                ],
              }).finish(),
            },
          ],
          memo: "ABC",
          timeoutHeight: "0",
          extensionOptions: [],
          nonCriticalExtensionOptions: [],
        }).finish(),
        authInfoBytes: AuthInfo.encode({
          signerInfos: [
            {
              publicKey: {
                typeUrl: "/cosmos.crypto.secp256k1.PubKey",
                value: PubKey.encode({
                  key: (await window.keplr.getKey(current.chainId)).pubKey,
                }).finish(),
              },
              modeInfo: {
                single: {
                  mode: SignMode.SIGN_MODE_DIRECT,
                },
                multi: undefined,
              },
              sequence: account.sequence,
            },
          ],
          fee: {
            amount: [
              {
                denom: feeCurrency.coinDenom,
                amount: "1000",
              },
            ],
            gasLimit: "100000",
            payer: accountInfo.bech32Address,
            granter: "",
          },
        }).finish(),
        chainId: current.chainId,
        accountNumber: Long.fromString(account.account_number),
      }
    );
    if (signRes) {
      console.log("signRes", signRes);
      try {
        const sendRes = await window.keplr?.sendTx(
          current.chainId,
          TxRaw.encode({
            bodyBytes: signRes.signed.bodyBytes,
            authInfoBytes: signRes.signed.authInfoBytes,
            signatures: [Buffer.from(signRes.signature.signature, "base64")],
          }).finish(),
          "block" as BroadcastMode
        );
        console.log("sendRes", sendRes);
      } catch (err) {
        console.error(err);
      } finally {
        window.location.hash = "#/keystone/example";
      }
    }
  }, [accountStore, chainStore]);

  const signArbitrary = async (data: string | Uint8Array) => {
    const accountInfo = accountStore.getAccount(chainStore.current.chainId);
    console.log(chainStore.current.chainId, accountInfo.bech32Address);
    if (!chainStore.current.chainId || !accountInfo.bech32Address) {
      console.log("Try again!");
      return;
    }
    try {
      const params: [string, string, string | Uint8Array, StdSignature] = [
        chainStore.current.chainId,
        accountInfo.bech32Address,
        data,
        {} as StdSignature,
      ];
      const signRes = await window.keplr?.signArbitrary(
        params[0],
        params[1],
        params[2]
      );
      console.log("signRes", signRes);
      if (signRes) {
        params[3] = signRes;
        const verifyRes = await window.keplr?.verifyArbitrary(...params);
        console.log("verifyRes", verifyRes);
      }
    } catch (err) {
      console.error(err);
    } finally {
      window.location.hash = "#/keystone/example";
    }
  };
  const signArbitraryString = useCallback(async () => {
    signArbitrary("123");
  }, []);
  const signArbitraryBuffer = useCallback(async () => {
    signArbitrary(Buffer.from("ABC"));
  }, []);

  const signEthereum = useCallback(async () => {
    const current = chainStore.current;
    const accountInfo = accountStore.getAccount(current.chainId);
    console.log(current.chainId, accountInfo.bech32Address);
    if (!current.chainId || !accountInfo.bech32Address) {
      console.log("Try again!");
      return;
    }
    const signRes = await window.keplr?.signEthereum(
      current.chainId,
      accountInfo.bech32Address,
      JSON.stringify({
        from: "0xEA3a45668A16E343c2fEfeD7463e62463bd40297",
        to: "0x3Cd30F57cB5A9DeaD668a655139F3D7a41cA3765",
        gasLimit: `0x${Buffer.from("21000").toString("hex")}`,
        nonce: `0x${Buffer.from("0").toString("hex")}`,
        value: `0x${Buffer.from("1000").toString("hex")}`,
      }),
      EthSignType.TRANSACTION
    );
    if (signRes) {
      try {
        const sendRes = await window.keplr?.sendTx(
          current.chainId,
          signRes,
          "block" as BroadcastMode
        );
        console.log("sendRes", sendRes);
      } catch (err) {
        console.error(err);
      } finally {
        window.location.hash = "#/keystone/example";
      }
    }
  }, [chainStore, accountStore]);

  const verify = () => {
    const data = Buffer.from(
      "0a8d010a85010a1c2f636f736d6f732e62616e6b2e763162657461312e4d736753656e6412650a2b6f736d6f3139726c34636d32686d7238616679346b6c6470787a33666b61346a6775713061356d37646638122b6f736d6f317074713766677830636767686c706a7376617272356b7a6e6c6b6a336837746d6772307034641a090a044f534d4f12013112034142431294010a500a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a21024f4e2ad99c34d60b9ba6283c9431a8418af8673212961f97a77b6377fcd05b6212040a020801180212400a0d0a05756f736d6f12043235303010a08d061a2b6f736d6f3139726c34636d32686d7238616679346b6c6470787a33666b61346a6775713061356d376466381a0b6f736d6f2d746573742d3420e8fc10",
      "hex"
    );

    const priv = new PrivKeySecp256k1(
      Buffer.from(
        "797157ef0e02fda15b73e68e267d349fdf52ea3a248bdcc98883a63a2057f080",
        "hex"
      )
    );

    const signature = priv.signDigest32(Hash.sha256(data));

    const pub = new PubKeySecp256k1(
      Buffer.from(
        "024f4e2ad99c34d60b9ba6283c9431a8418af8673212961f97a77b6377fcd05b62",
        "hex"
      )
    );

    console.log(
      "verify priv sign",
      pub.verifyDigest32(Hash.sha256(data), signature),
      Buffer.from(signature).toString("hex")
    );

    const res = pub.verifyDigest32(
      Hash.sha256(data),
      Buffer.from(
        "c3b6cda9269605a54c4626665bddfd1521192c6287d2a12654a662ad141d8c110095b5093e1d4709a930a6ee42948a18a511566c1a472dc855f833733b300818",
        "hex"
      )
    );
    console.log("verify", res);
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <p>
        <Button onClick={verify}>Verify Signature</Button>
      </p>
      <p>
        <Button onClick={signDirect}>Sign Direct</Button>
      </p>
      <p>
        <Button onClick={signArbitraryString}>Sign Arbitrary String</Button>
      </p>
      <p>
        <Button onClick={signArbitraryBuffer}>Sign Arbitrary Buffer</Button>
      </p>
      <p>
        <Button onClick={signEthereum}>Sign Eth</Button>
      </p>
    </div>
  );
}
