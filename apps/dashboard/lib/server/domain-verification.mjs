import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { Resolver } from 'node:dns/promises';
import { request } from 'node:https';
import { BlockList, isIPv4 } from 'node:net';
const blocked = new BlockList();
for (const [ip, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.88.99.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
])
  blocked.addSubnet(ip, prefix);
export const hashToken = (value) => createHash('sha256').update(value).digest('hex');
export function isPublicAddress(ip) {
  return isIPv4(ip) && !blocked.check(ip, 'ipv4');
}
export function normalizeHostname(value) {
  if (typeof value !== 'string') throw new Error('A public hostname is required');
  const domain = value.toLowerCase().trim();
  if (
    !/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(domain) ||
    /\.(?:localhost|local|internal|test|invalid|example)$/.test(domain)
  )
    throw new Error('Use an exact public hostname without a scheme, path, wildcard, or port');
  return domain;
}
export function createChallenge(domain, method, now = Date.now()) {
  domain = normalizeHostname(domain);
  if (!['dns', 'http'].includes(method)) throw new Error('Choose dns or http verification');
  const token = 'accordly-verification=' + randomBytes(32).toString('hex');
  const id = crypto.randomUUID();
  return {
    id,
    domain,
    method,
    token,
    tokenHash: hashToken(token),
    expiresAt: new Date(now + 24 * 3600000).toISOString(),
    dnsName: '_accordly-challenge.' + domain,
    httpUrl: `https://${domain}/.well-known/accordly-verification.txt`,
  };
}
async function dnsQuery(method, name) {
  const resolver = new Resolver({ timeout: 3000, tries: 1 });
  const timer = setTimeout(() => resolver.cancel(), 5000);
  try {
    return await resolver[method](name);
  } finally {
    clearTimeout(timer);
  }
}
function readHttps(domain, address) {
  return new Promise((resolve, reject) => {
    const req = request(
      {
        hostname: domain,
        port: 443,
        path: '/.well-known/accordly-verification.txt',
        method: 'GET',
        agent: false,
        rejectUnauthorized: true,
        servername: domain,
        lookup: (_host, options, callback) => {
          if (options.all) callback(null, [{ address, family: 4 }]);
          else callback(null, address, 4);
        },
        headers: {
          Accept: 'text/plain',
          'User-Agent': 'Accordly-Domain-Verification/1.0',
          'Accept-Encoding': 'identity',
        },
      },
      (response) => {
        if (response.statusCode !== 200) {
          response.destroy();
          reject(new Error('Verification file must return HTTP 200 without redirects'));
          return;
        }
        let bytes = 0;
        const chunks = [];
        response.on('data', (chunk) => {
          bytes += chunk.length;
          if (bytes > 4096) {
            response.destroy(new Error('Verification file exceeds 4096 bytes'));
            return;
          }
          chunks.push(chunk);
        });
        response.on('error', reject);
        response.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      },
    );
    const timeout = setTimeout(
      () => req.destroy(new Error('Verification request timed out')),
      5000,
    );
    req.on('close', () => clearTimeout(timeout));
    req.on('error', reject);
    req.end();
  });
}
export async function verifyChallenge(
  challenge,
  {
    txt = (name) => dnsQuery('resolveTxt', name),
    addresses = (name) => dnsQuery('resolve4', name),
    https = readHttps,
    now = Date.now(),
  } = {},
) {
  const domain = normalizeHostname(challenge.domain);
  if (
    new Date(challenge.expiresAt).getTime() <= now ||
    !Number.isFinite(new Date(challenge.expiresAt).getTime())
  )
    throw new Error('Challenge expired; generate a new challenge');
  let candidates;
  if (challenge.method === 'dns')
    candidates = (await txt('_accordly-challenge.' + domain)).map((parts) => parts.join(''));
  else if (challenge.method === 'http') {
    const ips = await addresses(domain);
    if (!ips.length || ips.some((ip) => !isPublicAddress(ip)))
      throw new Error('Hostname must resolve only to public IPv4 addresses');
    // Pin the approved address for the TLS connection; never resolve it a second time.
    candidates = [String(await https(domain, ips[0])).trim()];
  } else throw new Error('Invalid verification method');
  const expected = Buffer.from(challenge.tokenHash, 'hex');
  return candidates.some((value) => {
    const actual = Buffer.from(hashToken(value), 'hex');
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  });
}
