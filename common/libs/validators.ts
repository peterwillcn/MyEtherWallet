import { toChecksumAddress } from 'ethereumjs-util';
import WalletAddressValidator from 'wallet-address-validator';
import { normalise } from './ens';
import { Validator } from 'jsonschema';
import { JsonRpcResponse } from './nodes/rpc/types';

// FIXME we probably want to do checksum checks sideways
export function isValidETHAddress(address: string): boolean {
  if (address === '0x0000000000000000000000000000000000000000') {
    return false;
  }
  if (address.substring(0, 2) !== '0x') {
    return false;
  } else if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) {
    return false;
  } else if (
    /^(0x)?[0-9a-f]{40}$/.test(address) ||
    /^(0x)?[0-9A-F]{40}$/.test(address)
  ) {
    return true;
  } else {
    return isChecksumAddress(address);
  }
}

export function isValidBTCAddress(address: string): boolean {
  return WalletAddressValidator.validate(address, 'BTC');
}

export function isValidHex(str: string): boolean {
  if (str === '') {
    return true;
  }
  str =
    str.substring(0, 2) === '0x'
      ? str.substring(2).toUpperCase()
      : str.toUpperCase();
  const re = /^[0-9A-F]*$/g; // Match 0 -> unlimited times, 0 being "0x" case
  return re.test(str);
}

export function isValidENSorEtherAddress(address: string): boolean {
  return isValidETHAddress(address) || isValidENSAddress(address);
}

export function isValidENSName(str: string) {
  try {
    return (
      str.length > 6 && normalise(str) !== '' && str.substring(0, 2) !== '0x'
    );
  } catch (e) {
    return false;
  }
}

export function isValidENSAddress(address: string): boolean {
  try {
    const normalized = normalise(address);
    const tld = normalized.substr(normalized.lastIndexOf('.') + 1);
    const validTLDs = {
      eth: true,
      test: true,
      reverse: true
    };
    if (validTLDs[tld]) {
      return true;
    }
  } catch (e) {
    return false;
  }
  return false;
}

function isChecksumAddress(address: string): boolean {
  return address === toChecksumAddress(address);
}

export function isValidPrivKey(privkey: string | Buffer): boolean {
  if (typeof privkey === 'string') {
    return privkey.length === 64;
  } else if (privkey instanceof Buffer) {
    return privkey.length === 32;
  } else {
    return false;
  }
}

export function isValidEncryptedPrivKey(privkey: string): boolean {
  if (typeof privkey === 'string') {
    return privkey.length === 128 || privkey.length === 132;
  } else {
    return false;
  }
}

export function isPositiveIntegerOrZero(num: number): boolean {
  if (isNaN(num) || !isFinite(num)) {
    return false;
  }
  return num >= 0 && parseInt(num.toString(), 10) === num;
}

// Full length deterministic wallet paths from BIP44
// https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki
// normal path length is 4, ledger is the exception at 3
export function isValidPath(dPath: string) {
  // TODO: use a regex to detect proper paths
  const len = dPath.split("'/").length;
  return len === 3 || len === 4;
}

export const isValidValue = (value: string) =>
  !!(value && isFinite(parseFloat(value)) && parseFloat(value) >= 0);

export const isValidGasPrice = (gasLimit: string) =>
  !!(gasLimit && isFinite(parseFloat(gasLimit)) && parseFloat(gasLimit) > 0);

export const isValidByteCode = (byteCode: string) =>
  byteCode && byteCode.length > 0 && byteCode.length % 2 === 0;

export const isValidAbiJson = (abiJson: string) =>
  abiJson && abiJson.startsWith('[') && abiJson.endsWith(']');

// JSONSchema Validations for Rpc responses
const v = new Validator();

export const schema = {
  RpcNode: {
    type: 'object',
    additionalProperties: false,
    properties: {
      jsonrpc: { type: 'string' },
      id: { oneOf: [{ type: 'string' }, { type: 'integer' }] },
      result: { type: 'string' },
      status: { type: 'string' },
      message: { type: 'string', maxLength: 2 }
    }
  }
};

function isValidResult(response: JsonRpcResponse, schemaFormat): boolean {
  return v.validate(response, schemaFormat).valid;
}

function formatErrors(response: JsonRpcResponse, apiType: string) {
  if (response.error) {
    return `${response.error.message} ${response.error.data}`;
  }
  return `Invalid ${apiType} Error`;
}

const isValidEthCall = (response: JsonRpcResponse, schemaType) => (
  apiName,
  cb?
) => {
  if (!isValidResult(response, schemaType)) {
    if (cb) {
      return cb(response);
    }
    throw new Error(formatErrors(response, apiName));
  }
  return response;
};

export const isValidGetBalance = (response: JsonRpcResponse) =>
  isValidEthCall(response, schema.RpcNode)('Get Balance');

export const isValidEstimateGas = (response: JsonRpcResponse) =>
  isValidEthCall(response, schema.RpcNode)('Estimate Gas');

export const isValidCallRequest = (response: JsonRpcResponse) =>
  isValidEthCall(response, schema.RpcNode)('Call Request');

export const isValidTokenBalance = (response: JsonRpcResponse) =>
  isValidEthCall(response, schema.RpcNode)('Token Balance', () => ({
    result: 'Failed'
  }));

export const isValidTransactionCount = (response: JsonRpcResponse) =>
  isValidEthCall(response, schema.RpcNode)('Transaction Count');

export const isValidCurrentBlock = (response: JsonRpcResponse) =>
  isValidEthCall(response, schema.RpcNode)('Current Block');

export const isValidRawTxApi = (response: JsonRpcResponse) =>
  isValidEthCall(response, schema.RpcNode)('Raw Tx');
