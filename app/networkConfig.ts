import { getFullnodeUrl } from "@mysten/sui/client";
import { createNetworkConfig } from "@mysten/dapp-kit";
import {
  DEVNET_SHALLOT_PACKAGE_ID,
  TESTNET_SHALLOT_PACKAGE_ID,
  MAINNET_SHALLOT_PACKAGE_ID,
} from "./constants";

// Create network configuration for Shallot
const { networkConfig, useNetworkVariable, useNetworkVariables } =
  createNetworkConfig({
    devnet: {
      url: getFullnodeUrl("devnet"),
      variables: {
        shallotPackageId: DEVNET_SHALLOT_PACKAGE_ID,
      },
    },
    testnet: {
      url: getFullnodeUrl("testnet"),
      variables: {
        shallotPackageId: TESTNET_SHALLOT_PACKAGE_ID,
      },
    },
    mainnet: {
      url: getFullnodeUrl("mainnet"),
      variables: {
        shallotPackageId: MAINNET_SHALLOT_PACKAGE_ID,
      },
    },
  });

export { useNetworkVariable, useNetworkVariables, networkConfig };