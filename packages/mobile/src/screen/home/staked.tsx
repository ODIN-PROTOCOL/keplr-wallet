import React, {FunctionComponent, useMemo, useRef, useState} from 'react';
import {CollapsibleList} from '../../components/collapsible-list';
import {Dec} from '@keplr-wallet/unit';
import {ViewToken} from './index';
import {observer} from 'mobx-react-lite';
import {Stack} from '../../components/stack';
import {useStore} from '../../stores';
import {TokenItem, TokenTitleView} from './components/token';
import {MainEmptyView} from './components/empty-view';
import FastImage from 'react-native-fast-image';
import {useIntl} from 'react-intl';
import {Modal} from '../../components/modal';
import {
  InformationModal,
  InformationModalProps,
} from '../../components/modal/infoModal';
import {BottomSheetModal} from '@gorhom/bottom-sheet';
import {useNavigation} from '@react-navigation/native';
import {StackNavProp} from '../../navigation';
import {SelectStakingChainModal} from './stakeing-chain-select-modal';
import {BottomSheetModalMethods} from '@gorhom/bottom-sheet/lib/typescript/types';

const zeroDec = new Dec(0);

export const StakedTabView: FunctionComponent<{
  SelectStakingChainModalRef: React.RefObject<BottomSheetModalMethods>;
}> = observer(({SelectStakingChainModalRef}) => {
  const {hugeQueriesStore, queriesStore} = useStore();
  const intl = useIntl();

  const stakablesTokenList = hugeQueriesStore.stakables;
  const stakablesTokenNonZeroList = useMemo(() => {
    return stakablesTokenList.filter(token => {
      return token.token.toDec().gt(zeroDec) && token.chainInfo.stakeCurrency;
    });
  }, [stakablesTokenList]);

  const navigate = useNavigation<StackNavProp>();

  const aprList = useMemo(() => {
    return stakablesTokenList.map(viewToken => {
      return queriesStore.get(viewToken.chainInfo.chainId).apr.queryApr.apr;
    });
  }, [stakablesTokenList, queriesStore]);

  const delegations: ViewToken[] = useMemo(
    () =>
      hugeQueriesStore.delegations.filter(token => {
        return token.token.toDec().gt(new Dec(0));
      }),
    [hugeQueriesStore.delegations],
  );
  const infoModalRef = useRef<BottomSheetModal>(null);

  const [infoModalState, setInfoModalState] = useState<InformationModalProps>({
    title: '',
    paragraph: '',
  });

  const unbondings: {
    viewToken: ViewToken;
    altSentence: string;
  }[] = useMemo(
    () =>
      hugeQueriesStore.unbondings
        .filter(unbonding => {
          return unbonding.viewToken.token.toDec().gt(new Dec(0));
        })
        .map(unbonding => {
          const relativeTime = formatRelativeTime(unbonding.completeTime);

          return {
            viewToken: unbonding.viewToken,
            altSentence: intl.formatRelativeTime(
              relativeTime.value,
              relativeTime.unit,
            ),
          };
        }),
    [hugeQueriesStore.unbondings, intl],
  );

  const TokenViewData: {
    title: string;
    balance:
      | ViewToken[]
      | {
          viewToken: ViewToken;
          altSentence: string;
        }[];
    lenAlwaysShown: number;
    paragraph: string;
  }[] = [
    {
      title: intl.formatMessage({
        id: 'page.main.staked.staked-balance-title',
      }),
      balance: delegations,
      lenAlwaysShown: 5,
      paragraph: intl.formatMessage({
        id: 'page.main.staked.staked-balance-tooltip',
      }),
    },
    {
      title: intl.formatMessage({
        id: 'page.main.staked.unstaking-balance-title',
      }),
      balance: unbondings,
      lenAlwaysShown: 3,
      paragraph: intl.formatMessage({
        id: 'page.main.staked.unstaking-balance-tooltip',
      }),
    },
  ];

  return (
    <React.Fragment>
      <Stack gutter={8}>
        {TokenViewData.map(({title, balance, lenAlwaysShown, paragraph}) => {
          if (balance.length === 0) {
            return null;
          }
          //NOTE delegation 일때만 apr을 보여줘야 하기 때문에 해당 변수 설정
          const isDelegation = title === TokenViewData[0].title;
          return (
            <CollapsibleList
              key={title}
              title={
                <TokenTitleView
                  title={title}
                  onOpenModal={() => {
                    setInfoModalState({title, paragraph});
                    infoModalRef.current?.present();
                  }}
                />
              }
              lenAlwaysShown={lenAlwaysShown}
              items={balance.map(viewToken => {
                if ('altSentence' in viewToken) {
                  return (
                    <TokenItem
                      apr={
                        isDelegation
                          ? aprList.filter(
                              ({chainId}) =>
                                chainId ===
                                viewToken.viewToken.chainInfo.chainId,
                            )[0]?.apr
                          : undefined
                      }
                      viewToken={viewToken.viewToken}
                      key={`${viewToken.viewToken.chainInfo.chainId}-${viewToken.viewToken.token.currency.coinMinimalDenom}`}
                      disabled={
                        !viewToken.viewToken.chainInfo.walletUrlForStaking
                      }
                      onClick={() => {
                        navigate.navigate('Stake', {
                          screen: 'Stake.Dashboard',
                          params: {
                            chainId: viewToken.viewToken.chainInfo.chainId,
                          },
                        });
                      }}
                      altSentence={viewToken.altSentence}
                    />
                  );
                }

                return (
                  <TokenItem
                    apr={
                      isDelegation
                        ? aprList.filter(
                            ({chainId}) =>
                              chainId === viewToken.chainInfo.chainId,
                          )[0]?.apr
                        : undefined
                    }
                    viewToken={viewToken}
                    key={`${viewToken.chainInfo.chainId}-${viewToken.token.currency.coinMinimalDenom}`}
                    disabled={!viewToken.chainInfo.walletUrlForStaking}
                    onClick={() => {
                      navigate.navigate('Stake', {
                        screen: 'Stake.Dashboard',
                        params: {chainId: viewToken.chainInfo.chainId},
                      });
                    }}
                  />
                );
              })}
            />
          );
        })}
      </Stack>

      {delegations.length === 0 && unbondings.length === 0 ? (
        <MainEmptyView
          image={
            <FastImage
              source={require('../../public/assets/img/main-empty-staking.png')}
              style={{
                width: 100,
                height: 100,
              }}
            />
          }
          title={intl.formatMessage({
            id: 'page.main.staked.empty-view-title',
          })}
          paragraph={intl.formatMessage({
            id: 'page.main.staked.empty-view-paragraph',
          })}
        />
      ) : null}

      <Modal ref={infoModalRef} enableDynamicSizing={true} snapPoints={['90%']}>
        <InformationModal
          title={infoModalState?.title}
          paragraph={infoModalState?.paragraph}
        />
      </Modal>

      <Modal ref={SelectStakingChainModalRef}>
        <SelectStakingChainModal
          onSelect={() => {}}
          aprList={aprList}
          items={stakablesTokenNonZeroList.map(token => ({
            key: token.chainInfo.chainId,
            viewToken: token,
          }))}
        />
      </Modal>
    </React.Fragment>
  );
});

function formatRelativeTime(time: string): {
  unit: 'minute' | 'hour' | 'day';
  value: number;
} {
  const remaining = new Date(time).getTime() - Date.now();
  if (remaining <= 0) {
    return {
      unit: 'minute',
      value: 1,
    };
  }

  const remainingSeconds = remaining / 1000;
  const remainingMinutes = remainingSeconds / 60;
  if (remainingMinutes < 1) {
    return {
      unit: 'minute',
      value: 1,
    };
  }

  const remainingHours = remainingMinutes / 60;
  const remainingDays = remainingHours / 24;

  if (remainingDays >= 1) {
    return {
      unit: 'day',
      value: Math.ceil(remainingDays),
    };
  }

  if (remainingHours >= 1) {
    return {
      unit: 'hour',
      value: Math.ceil(remainingHours),
    };
  }

  return {
    unit: 'minute',
    value: Math.ceil(remainingMinutes),
  };
}