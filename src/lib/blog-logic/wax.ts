import {
  createHiveChain,
  type TWaxExtended,
  type TWaxRestExtended
} from "@hiveio/wax";
import HafbeExtendedData from "@hiveio/wax-api-hafbe";
import WaxExtendedData from "@hiveio/wax-api-jsonrpc";

export type WaxExtendedChain = TWaxExtended<typeof WaxExtendedData, TWaxRestExtended<typeof HafbeExtendedData>>;

let chain: Promise<WaxExtendedChain>;

export const getWax = () => {
  if (!chain)
    return chain = createHiveChain().then(chain => chain.extend(WaxExtendedData).extendRest(HafbeExtendedData));

  return chain;
};
