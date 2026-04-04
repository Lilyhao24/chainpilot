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
    return { hasEns: false, ensName: null, address: null, display: '部署者身份：未知' };
  }

  try {
    const ensName = await publicClient.getEnsName({ address: deployerAddress });

    if (ensName) {
      return {
        hasEns: true,
        ensName,
        address: deployerAddress,
        display: `部署者身份：已验证ENS (${ensName})`,
        displayEn: `Deployer identity: Verified ENS (${ensName})`,
      };
    }

    return {
      hasEns: false,
      ensName: null,
      address: deployerAddress,
      display: '部署者身份：匿名地址',
      displayEn: 'Deployer identity: Anonymous address',
    };
  } catch {
    return {
      hasEns: false,
      ensName: null,
      address: deployerAddress,
      display: '部署者身份：查询失败',
      displayEn: 'Deployer identity: Lookup failed',
    };
  }
}
