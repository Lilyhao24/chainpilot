/**
 * ENSProfileCard — ENS name profile display
 * Shows avatar, name, description, social links, address
 * Uses eth.llamarpc.com (no CORS issues)
 */

import { useState, useEffect } from 'react';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { normalize } from 'viem/ens';

// Public client for ENS resolution (no CORS issues with llamarpc)
const publicClient = createPublicClient({
  chain: mainnet,
  transport: http('https://eth.llamarpc.com'),
});

export default function ENSProfileCard({ name }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        setError(null);

        const normalizedName = normalize(name);

        // Resolve address
        const address = await publicClient.getEnsAddress({ name: normalizedName });
        if (!address) {
          setError('ENS 名称未找到');
          return;
        }

        // Fetch avatar and text records in parallel
        const [avatar, description, twitter, github, url] = await Promise.all([
          publicClient.getEnsAvatar({ name: normalizedName }).catch(() => null),
          publicClient.getEnsText({ name: normalizedName, key: 'description' }).catch(() => null),
          publicClient.getEnsText({ name: normalizedName, key: 'com.twitter' }).catch(() => null),
          publicClient.getEnsText({ name: normalizedName, key: 'com.github' }).catch(() => null),
          publicClient.getEnsText({ name: normalizedName, key: 'url' }).catch(() => null),
        ]);

        setProfile({
          name: normalizedName,
          address,
          avatar: avatar || `https://metadata.ens.domains/mainnet/avatar/${normalizedName}`,
          description,
          twitter,
          github,
          url,
        });
      } catch (err) {
        setError(`查询失败: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }

    if (name) fetchProfile();
  }, [name]);

  if (loading) {
    return (
      <div className="rounded-lg p-4 my-2 border border-purple-500/20 bg-purple-500/5">
        <div className="text-sm text-gray-400 animate-pulse font-mechanical">
          🔗 正在查询 {name}...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg p-4 my-2 border border-red-500/20 bg-red-500/5">
        <div className="text-sm text-red-400">{error}</div>
      </div>
    );
  }

  if (!profile) return null;

  const shortAddr = `${profile.address.slice(0, 6)}...${profile.address.slice(-4)}`;

  return (
    <div
      className="rounded-lg overflow-hidden my-2"
      style={{
        border: '1px solid rgba(168, 85, 247, 0.25)',
        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.08), transparent)',
      }}
    >
      {/* Avatar + Name */}
      <div className="p-4 flex items-center gap-4">
        <img
          src={profile.avatar}
          alt={profile.name}
          className="w-14 h-14 rounded-full border-2 border-purple-500/30 object-cover"
          onError={(e) => {
            e.target.src = `https://metadata.ens.domains/mainnet/avatar/${profile.name}`;
          }}
        />
        <div>
          <div className="font-mechanical text-lg font-bold text-purple-300">
            {profile.name}
          </div>
          <div className="text-[10px] text-gray-500 font-mechanical mt-0.5">
            {shortAddr}
          </div>
        </div>
      </div>

      {/* Description */}
      {profile.description && (
        <div className="px-4 pb-2 text-xs text-gray-400">
          {profile.description}
        </div>
      )}

      {/* Social Links */}
      <div className="px-4 pb-4 flex flex-wrap gap-2">
        {profile.twitter && (
          <a
            href={`https://twitter.com/${profile.twitter}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] px-2.5 py-1 rounded-full border border-white/10 text-gray-400 hover:text-cyan-400 hover:border-cyan-400/30 transition-colors font-mechanical"
          >
            𝕏 {profile.twitter}
          </a>
        )}
        {profile.github && (
          <a
            href={`https://github.com/${profile.github}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] px-2.5 py-1 rounded-full border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-colors font-mechanical"
          >
            GitHub {profile.github}
          </a>
        )}
        {profile.url && (
          <a
            href={profile.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] px-2.5 py-1 rounded-full border border-white/10 text-gray-400 hover:text-purple-400 hover:border-purple-400/30 transition-colors font-mechanical"
          >
            🔗 Website
          </a>
        )}
      </div>
    </div>
  );
}
