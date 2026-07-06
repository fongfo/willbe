import { createHash } from 'crypto';
import { HttpError } from '../shared/http-error';
import type { PlanCommitment } from './anchor.types';

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

const SENSITIVE_KEYS = new Set([
  'accountnumber',
  'balance',
  'mnemonic',
  'password',
  'passphrase',
  'pin',
  'privatekey',
  'secret',
  'seedphrase'
]);

function assertJsonValue(value: unknown, path: string): asserts value is JsonValue {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    if (typeof value === 'number' && !Number.isFinite(value)) {
      throw new HttpError(400, `Invalid JSON number at ${path}`);
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => assertJsonValue(item, `${path}[${index}]`));
    return;
  }

  if (typeof value === 'object') {
    Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
      assertJsonValue(item, path ? `${path}.${key}` : key);
    });
    return;
  }

  throw new HttpError(400, `Unsupported JSON value at ${path}`);
}

export function rejectSensitiveKeys(value: unknown, path = ''): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => rejectSensitiveKeys(item, `${path}[${index}]`));
    return;
  }

  if (value && typeof value === 'object') {
    Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
      const nextPath = path ? `${path}.${key}` : key;
      if (SENSITIVE_KEYS.has(normalizeKey(key))) {
        throw new HttpError(400, `Sensitive field is not allowed: ${nextPath}`);
      }
      rejectSensitiveKeys(item, nextPath);
    });
  }
}

export function canonicalizeJson(value: unknown): string {
  assertJsonValue(value, '$');

  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalizeJson(item)).join(',')}]`;
  }

  const objectValue = value as Record<string, unknown>;
  const properties = Object.keys(objectValue)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalizeJson(objectValue[key])}`);
  return `{${properties.join(',')}}`;
}

function hashHex(input: string): string {
  return `0x${createHash('sha256').update(input).digest('hex')}`;
}

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function combine(left: string, right: string): string {
  const leftBytes = Buffer.from(left.slice(2), 'hex');
  const rightBytes = Buffer.from(right.slice(2), 'hex');
  return `0x${createHash('sha256')
    .update(Buffer.concat([leftBytes, rightBytes]))
    .digest('hex')}`;
}

function buildLeaves(snapshot: Record<string, unknown>): string[] {
  return Object.keys(snapshot)
    .sort()
    .map((key) => hashHex(`${key}:${canonicalizeJson(snapshot[key])}`));
}

function buildMerkleRoot(leaves: string[]): string {
  if (leaves.length === 0) {
    throw new HttpError(400, 'snapshot must contain at least one field');
  }

  let level = leaves;
  while (level.length > 1) {
    const next: string[] = [];
    for (let index = 0; index < level.length; index += 2) {
      const left = level[index] as string;
      const right = level[index + 1] ?? left;
      next.push(combine(left, right));
    }
    level = next;
  }

  return level[0] as string;
}

export function buildPlanRef(ownerRef: string): string {
  return hashHex(`pusaka:plan-ref:v1:${ownerRef}`);
}

export function buildPlanCommitment(snapshot: Record<string, unknown>): PlanCommitment {
  rejectSensitiveKeys(snapshot);
  const leaves = buildLeaves(snapshot);
  const merkleRoot = buildMerkleRoot(leaves);
  return {
    merkleRoot,
    planHash: hashHex(`pusaka:plan-hash:v1:${merkleRoot}`),
    leafCount: leaves.length
  };
}
