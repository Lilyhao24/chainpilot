/**
 * ENS Deployer Trust Signal
 * Looks up whether a token's deployer has an ENS name
 * ENS = identity traceable, no ENS = anonymous deployer
 */

import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http('https://eth.llamarpc.com'),
});

/**
 * Check if a deployer address has an ENS name
 * @param {string} deployerAddress - The token deployer/creator address
 * @returns {Object} { hasEns, ensName, address }
 */
export async function checkDeployerENS(deployerAddress) {
  if (!deployerAddress) {
    return { hasEns: false, ensName: null, address: null, display: '部署者身份：未知', displayEn: 'Deployer: Unknown' };
  }

  const short = `${deployerAddress.slice(0, 6)}...${deployerAddress.slice(-4)}`;

  try {
    const ensName = await publicClient.getEnsName({ address: deployerAddress });

    if (ensName) {
      return {
        hasEns: true,
        ensName,
        address: deployerAddress,
        display: `部署者：${ensName}（已验证ENS）`,
        displayEn: `Deployer: ${ensName} (ENS verified)`,
      };
    }

    return {
      hasEns: false,
      ensName: null,
      address: deployerAddress,
      display: `部署者：${short}（未注册ENS）`,
      displayEn: `Deployer: ${short} (no ENS registered)`,
    };
  } catch {
    return {
      hasEns: false,
      ensName: null,
      address: deployerAddress,
      display: `部署者：${short}（未注册ENS）`,
      displayEn: `Deployer: ${short} (no ENS registered)`,
    };
  }
}
