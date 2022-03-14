/**
 * Created by i7 on 09.03.2017.
 */

function CorrectIP(addressDotQuad) {
	if (addressDotQuad === undefined) return '0.0.0.0';

	console.log('Correct IP s ', addressDotQuad);
	const split = addressDotQuad.split('.', 4);
	let byte1 = Math.max(
		0,
		Math.min(255, parseInt(split[0]))
	); /* sanity check: valid values: = 0-255 */
	let byte2 = Math.max(0, Math.min(255, parseInt(split[1])));
	let byte3 = Math.max(0, Math.min(255, parseInt(split[2])));
	let byte4 = Math.max(0, Math.min(255, parseInt(split[3])));
	if (isNaN(byte1)) {
		byte1 = 0;
	} /* fix NaN situations */
	if (isNaN(byte2)) {
		byte2 = 0;
	}
	if (isNaN(byte3)) {
		byte3 = 0;
	}
	if (isNaN(byte4)) {
		byte4 = 0;
	}
	addressDotQuad = byte1 + '.' + byte2 + '.' + byte3 + '.' + byte4;
	console.log('Correct IP f ', addressDotQuad);
	return addressDotQuad;
}

function IPv4_GetNetAddr(addressDotQuad, netmaskDot) {
	console.log('IPv4_GetNetAddr ip ', addressDotQuad, ' mask ', netmaskDot);
	let addressInteger = IPv4_dotquadA_to_intA(CorrectIP(addressDotQuad));
	let addressBinStr = IPv4_intA_to_binstrA(addressInteger);
	let netmaskBinStr = IPv4_intA_to_binstrA(IPv4_dotquadA_to_intA(netmaskDot));
	let netaddressBinStr = IPv4_Calc_netaddrBinStr(addressBinStr, netmaskBinStr);
	let netaddressInt = IPv4_binstrA_to_intA(netaddressBinStr);
	return IPv4_intA_to_dotquadA(netaddressInt);
}

function IPv4_GetBcast(addressDotQuad, netmaskDot) {
	console.log('IPv4_GetBcast ip ', addressDotQuad, ' mask ', netmaskDot);
	let addressInteger = IPv4_dotquadA_to_intA(CorrectIP(addressDotQuad));
	let addressBinStr = IPv4_intA_to_binstrA(addressInteger);
	let netmaskBinStr = IPv4_intA_to_binstrA(IPv4_dotquadA_to_intA(netmaskDot));
	let netbcastBinStr = IPv4_Calc_netbcastBinStr(addressBinStr, netmaskBinStr);
	let netbcastInteger = IPv4_binstrA_to_intA(netbcastBinStr);
	return IPv4_intA_to_dotquadA(netbcastInteger);
}

/* In some versions of JavaScript subnet calculators they use bitwise operations to shift the values left. Unfortunately JavaScript converts to a 32-bit signed integer when you mess with bits, which leaves you with the sign + 31 bits. For the first byte this means converting back to an integer results in a negative value for values 128 and higher since the leftmost bit, the sign, becomes 1. Using the 64-bit float allows us to display the integer value to the user. */
/* dotted-quad IP to integer */
function IPv4_dotquadA_to_intA(strbits) {
	if (strbits === undefined) return 0;
	const split = strbits.split('.', 4);
	return (
		parseFloat(split[0] * 16777216) /* 2^24 */ +
		parseFloat(split[1] * 65536) /* 2^16 */ +
		parseFloat(split[2] * 256) /* 2^8  */ +
		parseFloat(split[3])
	);
}

/* integer IP to dotted-quad */
function IPv4_intA_to_dotquadA(strnum) {
	const byte1 = strnum >>> 24;
	const byte2 = (strnum >>> 16) & 255;
	const byte3 = (strnum >>> 8) & 255;
	const byte4 = strnum & 255;
	return byte1 + '.' + byte2 + '.' + byte3 + '.' + byte4;
}

/* integer IP to binary string representation */
function IPv4_intA_to_binstrA(strnum) {
	let numStr = strnum.toString(2); /* Initialize return value as string */
	let numZeros = 32 - numStr.length; /* Calculate no. of zeros */
	if (numZeros > 0) {
		for (var i = 1; i <= numZeros; i++) {
			numStr = '0' + numStr;
		}
	}
	return numStr;
}

/* binary string IP to integer representation */
function IPv4_binstrA_to_intA(binstr) {
	return parseInt(binstr, 2);
}

/* The IPv4_Calc_* functions operate on string representations of the binary value because I don't trust JavaScript's sign + 31-bit bitwise functions. */
/* logical AND between address & netmask */
function IPv4_Calc_netaddrBinStr(addressBinStr, netmaskBinStr) {
	let netaddressBinStr = '';
	let aBit = 0;
	let nmBit = 0;
	for (pos = 0; pos < 32; pos++) {
		aBit = addressBinStr.substr(pos, 1);
		nmBit = netmaskBinStr.substr(pos, 1);
		if (aBit === nmBit) {
			netaddressBinStr += aBit.toString();
		} else {
			netaddressBinStr += '0';
		}
	}
	return netaddressBinStr;
}

/* logical OR between address & NOT netmask */
function IPv4_Calc_netbcastBinStr(addressBinStr, netmaskBinStr) {
	let netbcastBinStr = '';
	let aBit = 0;
	let nmBit = 0;
	for (pos = 0; pos < 32; pos++) {
		aBit = parseInt(addressBinStr.substr(pos, 1));
		nmBit = parseInt(netmaskBinStr.substr(pos, 1));

		if (nmBit) {
			nmBit = 0;
		} /* flip netmask bits */ else {
			nmBit = 1;
		}

		if (aBit || nmBit) {
			netbcastBinStr += '1';
		} else {
			netbcastBinStr += '0';
		}
	}
	return netbcastBinStr;
}

function getSubmask(input) {
	// self explanatory
	if (input === 0) {
		return '0.0.0.0';
	}
	if (input === 1) {
		return '128.0.0.0';
	}
	if (input === 2) {
		return '192.0.0.0';
	}
	if (input === 3) {
		return '224.0.0.0';
	}
	if (input === 4) {
		return '240.0.0.0';
	}
	if (input === 5) {
		return '248.0.0.0';
	}
	if (input === 6) {
		return '252.0.0.0';
	}
	if (input === 7) {
		return '254.0.0.0';
	}
	if (input === 8) {
		return '255.0.0.0';
	}
	if (input === 9) {
		return '255.128.0.0';
	}
	if (input === 10) {
		return '255.192.0.0';
	}
	if (input === 11) {
		return '255.224.0.0';
	}
	if (input === 12) {
		return '255.240.0.0';
	}
	if (input === 13) {
		return '255.248.0.0';
	}
	if (input === 14) {
		return '255.252.0.0';
	}
	if (input === 15) {
		return '255.254.0.0';
	}
	if (input === 16) {
		return '255.255.0.0';
	}
	if (input === 17) {
		return '255.255.128.0';
	}
	if (input === 18) {
		return '255.255.192.0';
	}
	if (input === 19) {
		return '255.255.224.0';
	}
	if (input === 20) {
		return '255.255.240.0';
	}
	if (input === 21) {
		return '255.255.248.0';
	}
	if (input === 22) {
		return '255.255.252.0';
	}
	if (input === 23) {
		return '255.255.254.0';
	}
	if (input === 24) {
		return '255.255.255.0';
	}
	if (input === 25) {
		return '255.255.255.128';
	}
	if (input === 26) {
		return '255.255.255.192';
	}
	if (input === 27) {
		return '255.255.255.224';
	}
	if (input === 28) {
		return '255.255.255.240';
	}
	if (input === 29) {
		return '255.255.255.248';
	}
	if (input === 30) {
		return '255.255.255.252';
	}
	if (input === 31) {
		return '255.255.255.254';
	}
	if (input === 32) {
		return '255.255.255.255';
	}
}

module.exports = {
	IPv4_GetBcast,
	IPv4_GetNetAddr,
	IPv4_intA_to_dotquadA,
	getSubmask
};
