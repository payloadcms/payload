import dnsSync from 'dns-sync'
import ipaddr from 'ipaddr.js'
import { Dispatcher } from 'undici'

import { APIError } from '../errors/APIError.js'

/**
 * Is Safe IP
 * @param ip - The IP address to check
 * @description Checks if the given IP address is safe to use.
 * It blocks loopback, private, link-local, multicast, reserved, and special IPs.
 * @returns boolean - Returns true if the IP is safe, false otherwise.
 * @throws APIError - Throws an error if the IP is invalid or unsafe.
 */
export const isSafeIp = (ip: null | string | undefined): boolean => {
  try {
    if (ip === null || ip === undefined || ip === '') {
      return false
    }
    if (!ipaddr.isValid(ip)) {
      return false
    }
    const parsedIpAddress = ipaddr.parse(ip)
    // Block loopback, private, link-local, multicast, reserved, and special IPs
    if (
      parsedIpAddress.range() !== 'unicast' ||
      parsedIpAddress.range() === 'loopback' ||
      parsedIpAddress.range() === 'linkLocal' ||
      parsedIpAddress.range() === 'multicast' ||
      parsedIpAddress.range() === 'private' ||
      parsedIpAddress.range() === 'reserved' ||
      parsedIpAddress.range() === 'unspecified' ||
      (parsedIpAddress.kind() === 'ipv4' && (ip === '0.0.0.0' || ip === '255.255.255.255'))
    ) {
      return false
    }
    // ipaddr.js does not have isLoopback/isPrivate for all, so check manually for IPv4
    if (parsedIpAddress.kind() === 'ipv4') {
      if (
        ip.startsWith('127.') || // loopback
        ip.startsWith('10.') || // private
        ip.startsWith('192.168.') || // private
        /^172\.(?:1[6-9]|2\d|3[01])\./.test(ip) || // private 172.16.0.0 - 172.31.255.255
        ip.startsWith('169.254.') || // link-local
        /^224\./.test(ip) // multicast
      ) {
        return false
      }
    }
    // For IPv6, block ::1 (loopback) and fc00::/7 (unique local)
    if (parsedIpAddress.kind() === 'ipv6') {
      if (parsedIpAddress.range() === 'loopback' || parsedIpAddress.range() === 'uniqueLocal') {
        return false
      }
    }
  } catch (ignore) {
    const error = new APIError(`Failed to fetch file from unsafe url, ${ip}`, 400)
    error.name = 'APIError'
    throw error
  }
  return true
}

/**
 * SafeDispatcher
 * A custom Undici Dispatcher that blocks requests to unsafe IPs.
 * It overrides the dispatch method to check the hostname of the request.
 * If the hostname resolves to an unsafe IP, it throws an APIError.
 * @extends Dispatcher
 * @description This class is used to ensure that requests made through it are safe and do not resolve to unsafe IP addresses.
 * @throws APIError - Throws an error if the hostname resolves to an unsafe IP address.
 */
export class SafeDispatcher extends Dispatcher {
  override dispatch(options: Dispatcher.DispatchOptions, handler: Dispatcher.DispatchHandler) {
    let hostname = options.origin

    if (typeof hostname === 'string') {
      try {
        const url = new URL(hostname)
        hostname = url.hostname
      } catch {
        // fallback: use as is
      }
    } else if (hostname instanceof URL) {
      hostname = hostname.hostname
    }
    if (typeof hostname === 'string') {
      const ip: string = dnsSync.resolve(hostname)
      if (!isSafeIp(ip)) {
        const error = new APIError(`Failed to fetch file from unsafe url, ${hostname} (${ip})`, 400)
        error.name = 'APIError'
        throw error
      }
    }
    return super.dispatch(options, handler)
  }
}

export const dispatcher = new SafeDispatcher() as Dispatcher
