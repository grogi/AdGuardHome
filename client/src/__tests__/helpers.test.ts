import { describe, expect, test, afterEach, vi, beforeEach, it } from 'vitest';

import { sortIp, countClientsStatistics, findAddressType, subnetMaskToBitMask, sortAddress } from '../helpers/helpers';
import { ADDRESS_TYPES } from '../helpers/constants';

function testBaseSortFunction(sortIp: (a: string, b: string) => number) {
    describe('ipv4', () => {
        test('one octet differ', () => {
            const arr = ['127.0.2.0', '127.0.3.0', '127.0.1.0'];
            const sortedArr = ['127.0.1.0', '127.0.2.0', '127.0.3.0'];

            expect(arr.sort(sortIp)).toStrictEqual(sortedArr);
        });

        test('few octets differ', () => {
            const arr = [
                '192.168.11.10',
                '192.168.10.0',
                '192.168.11.11',
                '192.168.10.10',
                '192.168.1.10',
                '192.168.0.1',
                '192.168.1.0',
                '192.168.1.1',
                '192.168.11.0',
                '192.168.0.10',
                '192.168.10.11',
                '192.168.0.11',
                '192.168.1.11',
                '192.168.0.0',
                '192.168.10.1',
                '192.168.11.1',
            ];
            const sortedArr = [
                '192.168.0.0',
                '192.168.0.1',
                '192.168.0.10',
                '192.168.0.11',
                '192.168.1.0',
                '192.168.1.1',
                '192.168.1.10',
                '192.168.1.11',
                '192.168.10.0',
                '192.168.10.1',
                '192.168.10.10',
                '192.168.10.11',
                '192.168.11.0',
                '192.168.11.1',
                '192.168.11.10',
                '192.168.11.11',
            ];

            expect(arr.sort(sortIp)).toStrictEqual(sortedArr);

            // Example from issue https://github.com/AdguardTeam/AdGuardHome/issues/1778#issuecomment-640937599
            const arr2 = [
                '192.168.2.11',
                '192.168.3.1',
                '192.168.2.100',
                '192.168.2.2',
                '192.168.2.1',
                '192.168.2.10',
                '192.168.2.99',
                '192.168.2.200',
                '192.168.2.199',
            ];
            const sortedArr2 = [
                '192.168.2.1',
                '192.168.2.2',
                '192.168.2.10',
                '192.168.2.11',
                '192.168.2.99',
                '192.168.2.100',
                '192.168.2.199',
                '192.168.2.200',
                '192.168.3.1',
            ];

            expect(arr2.sort(sortIp)).toStrictEqual(sortedArr2);
        });
    });

    describe('ipv6', () => {
        test('only long form', () => {
            const arr = ['2001:db8:11a3:9d7:0:0:0:2', '2001:db8:11a3:9d7:0:0:0:3', '2001:db8:11a3:9d7:0:0:0:1'];
            const sortedArr = ['2001:db8:11a3:9d7:0:0:0:1', '2001:db8:11a3:9d7:0:0:0:2', '2001:db8:11a3:9d7:0:0:0:3'];

            expect(arr.sort(sortIp)).toStrictEqual(sortedArr);
        });

        test('only short form', () => {
            const arr = ['2001:db8::', '2001:db7::', '2001:db9::'];
            const sortedArr = ['2001:db7::', '2001:db8::', '2001:db9::'];

            expect(arr.sort(sortIp)).toStrictEqual(sortedArr);
        });

        test('long and short forms', () => {
            const arr = [
                '2001:db8::',
                '2001:db7:11a3:9d7:0:0:0:2',
                '2001:db6:11a3:9d7:0:0:0:1',
                '2001:db6::',
                '2001:db7:11a3:9d7:0:0:0:1',
                '2001:db7::',
            ];
            const sortedArr = [
                '2001:db6::',
                '2001:db6:11a3:9d7:0:0:0:1',
                '2001:db7::',
                '2001:db7:11a3:9d7:0:0:0:1',
                '2001:db7:11a3:9d7:0:0:0:2',
                '2001:db8::',
            ];

            expect(arr.sort(sortIp)).toStrictEqual(sortedArr);
        });
    });

    describe('ipv4 and ipv6', () => {
        test('ipv6 long form', () => {
            const arr = [
                '127.0.0.3',
                '2001:db8:11a3:9d7:0:0:0:1',
                '2001:db8:11a3:9d7:0:0:0:3',
                '127.0.0.1',
                '2001:db8:11a3:9d7:0:0:0:2',
                '127.0.0.2',
            ];
            const sortedArr = [
                '127.0.0.1',
                '127.0.0.2',
                '127.0.0.3',
                '2001:db8:11a3:9d7:0:0:0:1',
                '2001:db8:11a3:9d7:0:0:0:2',
                '2001:db8:11a3:9d7:0:0:0:3',
            ];

            expect(arr.sort(sortIp)).toStrictEqual(sortedArr);
        });

        test('ipv6 short form', () => {
            const arr = [
                '2001:db8:11a3:9d7::1',
                '127.0.0.3',
                '2001:db8:11a3:9d7::3',
                '127.0.0.1',
                '2001:db8:11a3:9d7::2',
                '127.0.0.2',
            ];
            const sortedArr = [
                '127.0.0.1',
                '127.0.0.2',
                '127.0.0.3',
                '2001:db8:11a3:9d7::1',
                '2001:db8:11a3:9d7::2',
                '2001:db8:11a3:9d7::3',
            ];

            expect(arr.sort(sortIp)).toStrictEqual(sortedArr);
        });

        test('ipv6 long and short forms', () => {
            const arr = [
                '2001:db8:11a3:9d7::1',
                '127.0.0.3',
                '2001:db8:11a3:9d7:0:0:0:2',
                '127.0.0.1',
                '2001:db8:11a3:9d7::3',
                '127.0.0.2',
            ];
            const sortedArr = [
                '127.0.0.1',
                '127.0.0.2',
                '127.0.0.3',
                '2001:db8:11a3:9d7::1',
                '2001:db8:11a3:9d7:0:0:0:2',
                '2001:db8:11a3:9d7::3',
            ];

            expect(arr.sort(sortIp)).toStrictEqual(sortedArr);
        });

        test('always put ipv4 before ipv6', () => {
            const arr = [
                '::1',
                '0.0.0.2',
                '127.0.0.1',
                '::2',
                '2001:db8:11a3:9d7:0:0:0:2',
                '0.0.0.1',
                '2001:db8:11a3:9d7::1',
            ];
            const sortedArr = [
                '0.0.0.1',
                '0.0.0.2',
                '127.0.0.1',
                '::1',
                '::2',
                '2001:db8:11a3:9d7::1',
                '2001:db8:11a3:9d7:0:0:0:2',
            ];

            expect(arr.sort(sortIp)).toStrictEqual(sortedArr);
        });
    });

    describe('cidr', () => {
        test('only ipv4 cidr', () => {
            const arr = ['192.168.0.1/9', '192.168.0.1/7', '192.168.0.1/8'];
            const sortedArr = ['192.168.0.1/7', '192.168.0.1/8', '192.168.0.1/9'];

            expect(arr.sort(sortIp)).toStrictEqual(sortedArr);
        });

        test('ipv4 and cidr ipv4', () => {
            const arr = ['192.168.0.1/9', '192.168.0.1', '192.168.0.1/32', '192.168.0.1/7', '192.168.0.1/8'];
            const sortedArr = ['192.168.0.1/7', '192.168.0.1/8', '192.168.0.1/9', '192.168.0.1/32', '192.168.0.1'];

            expect(arr.sort(sortIp)).toStrictEqual(sortedArr);
        });

        test('only ipv6 cidr', () => {
            const arr = [
                '2001:db8:11a3:9d7::1/32',
                '2001:db8:11a3:9d7::1/64',
                '2001:db8:11a3:9d7::1/128',
                '2001:db8:11a3:9d7::1/24',
            ];
            const sortedArr = [
                '2001:db8:11a3:9d7::1/24',
                '2001:db8:11a3:9d7::1/32',
                '2001:db8:11a3:9d7::1/64',
                '2001:db8:11a3:9d7::1/128',
            ];

            expect(arr.sort(sortIp)).toStrictEqual(sortedArr);
        });

        test('ipv6 and cidr ipv6', () => {
            const arr = [
                '2001:db8:11a3:9d7::1/32',
                '2001:db8:11a3:9d7::1',
                '2001:db8:11a3:9d7::1/64',
                '2001:db8:11a3:9d7::1/128',
                '2001:db8:11a3:9d7::1/24',
            ];
            const sortedArr = [
                '2001:db8:11a3:9d7::1/24',
                '2001:db8:11a3:9d7::1/32',
                '2001:db8:11a3:9d7::1/64',
                '2001:db8:11a3:9d7::1/128',
                '2001:db8:11a3:9d7::1',
            ];

            expect(arr.sort(sortIp)).toStrictEqual(sortedArr);
        });
    });

    describe('mixed', () => {
        test('ipv4, ipv6 in short and long forms and cidr', () => {
            const arr = [
                '2001:db8:11a3:9d7:0:0:0:1/32',
                '192.168.1.2',
                '127.0.0.2',
                '2001:db8:11a3:9d7::1/128',
                '2001:db8:11a3:9d7:0:0:0:1',
                '127.0.0.1/12',
                '192.168.1.1',
                '2001:db8::/32',
                '2001:db8:11a3:9d7::1/24',
                '192.168.1.2/12',
                '2001:db7::/32',
                '127.0.0.1',
                '2001:db8:11a3:9d7:0:0:0:2',
                '192.168.1.1/24',
                '2001:db7::/64',
                '2001:db7::',
                '2001:db8::',
                '2001:db8:11a3:9d7:0:0:0:1/128',
                '192.168.1.1/12',
                '127.0.0.1/32',
                '::1',
            ];
            const sortedArr = [
                '127.0.0.1/12',
                '127.0.0.1/32',
                '127.0.0.1',
                '127.0.0.2',
                '192.168.1.1/12',
                '192.168.1.1/24',
                '192.168.1.1',
                '192.168.1.2/12',
                '192.168.1.2',
                '::1',
                '2001:db7::/32',
                '2001:db7::/64',
                '2001:db7::',
                '2001:db8::/32',
                '2001:db8::',
                '2001:db8:11a3:9d7::1/24',
                '2001:db8:11a3:9d7:0:0:0:1/32',
                '2001:db8:11a3:9d7::1/128',
                '2001:db8:11a3:9d7:0:0:0:1/128',
                '2001:db8:11a3:9d7:0:0:0:1',
                '2001:db8:11a3:9d7:0:0:0:2',
            ];

            expect(arr.sort(sortIp)).toStrictEqual(sortedArr);
        });
    });
}

describe('sortIp', () => {
    testBaseSortFunction(sortIp);

    describe('invalid input', () => {
        const originalWarn = console.warn;

        beforeEach(() => {
            console.warn = vi.fn();
        });

        afterEach(() => {
            expect(console.warn).toHaveBeenCalled();
            console.warn = originalWarn;
        });

        test('invalid strings', () => {
            const arr = ['invalid ip', 'invalid cidr'];

            expect(arr.sort(sortIp)).toStrictEqual(arr);
        });

        test('invalid ip', () => {
            const arr = ['127.0.0.2.', '.127.0.0.1.', '.2001:db8:11a3:9d7:0:0:0:0'];

            expect(arr.sort(sortIp)).toStrictEqual(arr);
        });

        test('invalid cidr', () => {
            const arr = ['127.0.0.2/33', '2001:db8:11a3:9d7:0:0:0:0/129'];

            expect(arr.sort(sortIp)).toStrictEqual(arr);
        });

        test('valid and invalid ip', () => {
            const arr = ['127.0.0.4.', '127.0.0.1', '.127.0.0.3', '127.0.0.2'];

            expect(arr.sort(sortIp)).toStrictEqual(arr);
        });
    });
})

describe('sortAddress', () => {
    testBaseSortFunction(sortAddress);

    describe('mixed_withString', () => {
        test('only non-ip strings', () => {
            const arr = [
                'fritz.box', 
                'adguard-home.fritz.box', 
                'foo.bar',
                'example.com',
                'my.router.local',
                'office.lan',
                'server.example.org',
                'mail.google.com',
                'desktop.home',
                'printer.office.lan',
                'web.internal',
                'host123.domain.net',
                'api.service.company',
            ];
            
            const sortedArr = [
                'adguard-home.fritz.box',
                'api.service.company',
                'desktop.home',
                'example.com',
                'foo.bar',
                'fritz.box',
                'host123.domain.net',
                'mail.google.com',
                'my.router.local',
                'office.lan',
                'printer.office.lan',
                'server.example.org',
                'web.internal',
            ];

            expect(arr.sort(sortAddress)).toStrictEqual(sortedArr);
        });

        test('ipv4, ipv6 in short and long forms and cidr', () => {
            const arr = [
                '2001:db8:11a3:9d7:0:0:0:1/32',
                '192.168.1.2',
                '127.0.0.2',
                'foo.bar',
                '2001:db8:11a3:9d7::1/128',
                '2001:db8:11a3:9d7:0:0:0:1',
                '127.0.0.1/12',
                'fritz.box',
                'adguard-home.fritz.box',
                '192.168.1.1',
                '2001:db8::/32',
                '2001:db8:11a3:9d7::1/24',
                '192.168.1.2/12',
                '2001:db7::/32',
                '127.0.0.1',
                '2001:db8:11a3:9d7:0:0:0:2',
                '192.168.1.1/24',
                '2001:db7::/64',
                '2001:db7::',
                '2001:db8::',
                '2001:db8:11a3:9d7:0:0:0:1/128',
                '192.168.1.1/12',
                '127.0.0.1/32',
                '*.home.fritz.net',
                '::1',
            ];
            const sortedArr = [
                '127.0.0.1/12',
                '127.0.0.1/32',
                '127.0.0.1',
                '127.0.0.2',
                '192.168.1.1/12',
                '192.168.1.1/24',
                '192.168.1.1',
                '192.168.1.2/12',
                '192.168.1.2',
                '::1',
                '2001:db7::/32',
                '2001:db7::/64',
                '2001:db7::',
                '2001:db8::/32',
                '2001:db8::',
                '2001:db8:11a3:9d7::1/24',
                '2001:db8:11a3:9d7:0:0:0:1/32',
                '2001:db8:11a3:9d7::1/128',
                '2001:db8:11a3:9d7:0:0:0:1/128',
                '2001:db8:11a3:9d7:0:0:0:1',
                '2001:db8:11a3:9d7:0:0:0:2',
                '*.home.fritz.net',
                'adguard-home.fritz.box',
                'foo.bar',
                'fritz.box',
            ];

            expect(arr.sort(sortAddress)).toStrictEqual(sortedArr);
        });
    });
})

describe('findAddressType', () => {
    it('should return IP type for IP addresses', () => {
        expect(findAddressType('127.0.0.1')).toStrictEqual(ADDRESS_TYPES.IP);
    });

    it('should return CIDR type for CIDR addresses', () => {
        expect(findAddressType('127.0.0.1/8')).toStrictEqual(ADDRESS_TYPES.CIDR);
    });

    it('should return UNKNOWN type for MAC addresses', () => {
        expect(findAddressType('00:1B:44:11:3A:B7')).toStrictEqual(ADDRESS_TYPES.UNKNOWN);
    });
});

describe('countClientsStatistics', () => {
    test('single ip', () => {
        expect(
            countClientsStatistics(['127.0.0.1'], {
                '127.0.0.1': 1,
            }),
        ).toStrictEqual(1);
    });

    test('multiple ip', () => {
        expect(
            countClientsStatistics(['127.0.0.1', '127.0.0.2'], {
                '127.0.0.1': 1,
                '127.0.0.2': 2,
            }),
        ).toStrictEqual(1 + 2);
    });

    test('cidr', () => {
        expect(
            countClientsStatistics(['127.0.0.0/8'], {
                '127.0.0.1': 1,
                '127.0.0.2': 2,
            }),
        ).toStrictEqual(1 + 2);
    });

    test('cidr and multiple ip', () => {
        expect(
            countClientsStatistics(['1.1.1.1', '2.2.2.2', '3.3.3.0/24'], {
                '1.1.1.1': 1,
                '2.2.2.2': 2,
                '3.3.3.3': 3,
            }),
        ).toStrictEqual(1 + 2 + 3);
    });

    test('mac', () => {
        expect(
            countClientsStatistics(['00:1B:44:11:3A:B7', '2.2.2.2', '3.3.3.0/24'], {
                '1.1.1.1': 1,
                '2.2.2.2': 2,
                '3.3.3.3': 3,
            }),
        ).toStrictEqual(2 + 3);
    });

    test('not found', () => {
        expect(
            countClientsStatistics(['4.4.4.4', '5.5.5.5', '6.6.6.6'], {
                '1.1.1.1': 1,
                '2.2.2.2': 2,
                '3.3.3.3': 3,
            }),
        ).toStrictEqual(0);
    });
});

describe('subnetMaskToBitMask', () => {
    const subnetMasks = [
        '0.0.0.0',
        '128.0.0.0',
        '192.0.0.0',
        '224.0.0.0',
        '240.0.0.0',
        '248.0.0.0',
        '252.0.0.0',
        '254.0.0.0',
        '255.0.0.0',
        '255.128.0.0',
        '255.192.0.0',
        '255.224.0.0',
        '255.240.0.0',
        '255.248.0.0',
        '255.252.0.0',
        '255.254.0.0',
        '255.255.0.0',
        '255.255.128.0',
        '255.255.192.0',
        '255.255.224.0',
        '255.255.240.0',
        '255.255.248.0',
        '255.255.252.0',
        '255.255.254.0',
        '255.255.255.0',
        '255.255.255.128',
        '255.255.255.192',
        '255.255.255.224',
        '255.255.255.240',
        '255.255.255.248',
        '255.255.255.252',
        '255.255.255.254',
        '255.255.255.255',
    ];

    test('correct for all subnetMasks', () => {
        expect(
            subnetMasks
                .map((subnetMask) => {
                    const bitmask = subnetMaskToBitMask(subnetMask);
                    return subnetMasks[bitmask] === subnetMask;
                })
                .every((res) => res === true),
        ).toEqual(true);
    });
});
