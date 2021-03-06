/***************************************
 * Copyright 2011, 2012 GlobWeb contributors.
 *
 * This file is part of GlobWeb.
 *
 * GlobWeb is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, version 3 of the License, or
 * (at your option) any later version.
 *
 * GlobWeb is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with GlobWeb. If not, see <http://www.gnu.org/licenses/>.
 ***************************************/
/** @constructor
	GlobWeb.HEALPixBase module
	Module which contains all the maths stuff
*/
GlobWeb.HEALPixBase = (function(){
	
	var HALF_PI = 3.14159265/2;
	
	var compress_bits = function(v){

		//  raw  = v & 0x5555555555555 in place of raw = v & 0x5555555555555555
		//		--> still not resolved, dunno why
		//
		
		// in Java implementation mask == 0x5555555555555555
		// var raw = v & 0x5555555555555; // v & 101010101010101010101010101010101010101010101010101010101010101
										  // // raw>>>15 = 0101010101010101010101010101010101010101010101010
		// var dec = raw>>>15;
		// raw |= dec;				  // 101010101010101111111111111111111111111111111111111111111111111
		// var raw1 = (raw&0xffff);
		// var dec2 = raw>>>31;
		// var raw2 = (dec2&0xffff);
		
		var longV = GlobWeb.Long.fromNumber(v);
		var longMask = GlobWeb.Long.fromNumber(0x5555555555555);
		var raw = longV.and(longMask);
		var dec = raw.shiftRightUnsigned(15);
		raw = raw.or(dec);
		var raw1 = (raw.and(GlobWeb.Long.fromNumber(0xffff))).toInt();
		var dec2 = raw.shiftRightUnsigned(32);
		var raw2 = (dec2.and(GlobWeb.Long.fromNumber(0xffff))).toInt();
		
		return GlobWeb.HealPixTables.ctab[raw1&0xff] | (GlobWeb.HealPixTables.ctab[raw1>>>8]<< 4) | (GlobWeb.HealPixTables.ctab[raw2&0xff]<<16) | (GlobWeb.HealPixTables.ctab[raw2>>>8]<<20);
	}
	
	var fxyf = function(_fx,_fy,_face){
		
		var jr = GlobWeb.HealPixTables.jrll[_face] - _fx - _fy;
		var z = 0;
		var phi = 0;
		var sth = 0;
		var have_sth = false;

		var nr;
		if (jr<1){
			nr = jr;
			var tmp = nr*nr/3.;
			z = 1 - tmp;
			if (z>0.99) { sth=Math.sqrt(tmp*(2.-tmp)); have_sth=true; }
		} else if (jr>3){
			nr = 4-jr;
			var tmp = nr*nr/3.;
			z = tmp - 1;
			if (z<-0.99) {
				sth=Math.sqrt(tmp*(2.-tmp)); 
				have_sth=true;
			}
		} else {
			nr = 1;
			z = (2-jr)*2./3.;
		}

		var tmp=GlobWeb.HealPixTables.jpll[_face]*nr+_fx-_fy;
		if (tmp<0) tmp+=8;
		if (tmp>=8) tmp-=8;
		
		phi = (nr<1e-15) ? 0 : (0.5*HALF_PI*tmp)/nr;
		
		var st = (have_sth) ? sth : Math.sqrt((1.0-z)*(1.0+z));
		return [st*Math.cos(phi), st*Math.sin(phi), z]
	}
	
	/**
	*	Static function
	*	Convert nside to order
	*	(ilog2(nside))
	*	
	*/
	var nside2order = function(arg){
		
		var res=0;
		while (arg > 0x0000FFFF) { res+=16; arg>>>=16; }
		if (arg > 0x000000FF) { res|=8; arg>>>=8; }
		if (arg > 0x0000000F) { res|=4; arg>>>=4; }
		if (arg > 0x00000003) { res|=2; arg>>>=2; }
		if (arg > 0x00000001) { res|=1; }
		return res;
	
	}
	
	return {
			compress_bits: compress_bits,
			fxyf: fxyf,
			nside2order: nside2order
		};
}());