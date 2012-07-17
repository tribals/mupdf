var MuPDF = new Array();

MuPDF.monthName = ['January','February','March','April','May','June','July','August','September','October','November','December'];
MuPDF.dayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

MuPDF.shortMonthName = new Array();

for (var i = 0; i < MuPDF.monthName.length; i++)
	MuPDF.shortMonthName.push(MuPDF.monthName[i].substr(0,3));

MuPDF.monthPattern = new RegExp();
MuPDF.monthPattern.compile('('+MuPDF.shortMonthName.join('|')+')');

MuPDF.padZeros = function(num, places)
{
	var s = num.toString();

	if (s.length < places)
		s = new Array(places-s.length+1).join('0') + s;

	return s;
}

var border = new Array();
border.s = "Solid";
border.d = "Dashed";
border.b = "Beveled";
border.i = "Inset";
border.u = "Underline";
var color = new Array();
color.transparent = [ "T" ];
color.black = [ "G", 0];
color.white = [ "G", 1];
color.red = [ "RGB", 1,0,0 ];
color.green = [ "RGB", 0,1,0 ];
color.blue = [ "RGB", 0,0,1 ];
color.cyan = [ "CMYK", 1,0,0,0 ];
color.magenta = [ "CMYK", 0,1,0,0 ];
color.yellow = [ "CMYK", 0,0,1,0 ];
color.dkGray = [ "G", 0.25];
color.gray = [ "G", 0.5];
color.ltGray = [ "G", 0.75];

var util = new Array();

util.printd = function(fmt, d)
{
	var regexp = /^(m+|d+|y+|H+|h+|M+|s+|t+|[^mdyHhMst]+)/;
	var res = '';

	if (!d)
		return null;

	while (fmt)
	{
		var token = fmt.match(regexp)[0];

		switch(token)
		{
			case 'mmmm': res += MuPDF.monthName[d.getMonth()]; break;
			case 'mmm': res += MuPDF.monthName[d.getMonth()].substr(0,3); break;
			case 'mm': res += MuPDF.padZeros(d.getMonth()+1, 2); break;
			case 'm': res += d.getMonth()+1; break;
			case 'dddd': res += MuPDF.dayName[d.getDay()]; break;
			case 'ddd': res += MuPDF.dayName[d.getDay()].substr(0,3); break;
			case 'dd': res += MuPDF.padZeros(d.getDate(), 2); break;
			case 'd': res += d.getDate(); break;
			case 'yyyy': res += d.getFullYear(); break;
			case 'yy': res += d.getFullYear()%100; break;
			case 'HH': res += MuPDF.padZeros(d.getHours(), 2); break;
			case 'H': res += d.getHours(); break;
			case 'hh': res += MuPDF.padZeros((d.getHours()+11)%12+1, 2); break;
			case 'h': res += (d.getHours()+11)%12+1; break;
			case 'MM': res += MuPDF.padZeros(d.getMinutes(), 2); break;
			case 'M': res += d.getMinutes(); break;
			case 'ss': res += MuPDF.padZeros(d.getSeconds(), 2); break;
			case 's': res += d.getSeconds(); break;
			case 'tt': res += d.getHours() < 12 ? 'am' : 'pm'; break;
			case 't': res += d.getHours() < 12 ? 'a' : 'p'; break;
			default: res += token;
		}

		fmt = fmt.substr(token.length);
	}

	return res;
}

function AFExtractTime(dt)
{
	var ampm = dt.match(/(am|pm)/);
	dt = dt.replace(/(am|pm)/, '');
	var t = dt.match(/\d{1,2}:\d{1,2}:\d{1,2}/);
	dt = dt.replace(/\d{1,2}:\d{1,2}:\d{1,2}/, '');
	if (!t)
	{
		t = dt.match(/\d{1,2}:\d{1,2}/);
		dt = dt.replace(/\d{1,2}:\d{1,2}/, '');
	}

	return [dt, t?t[0]+(ampm?ampm[0]:''):''];
}

function AFParseDateOrder(fmt)
{
	var order = '';

	// Ensure all present with those not added in default order
	fmt += "mdy";

	for (var i = 0; i < fmt.length; i++)
	{
		var c = fmt.charAt(i);

		if ('ymd'.indexOf(c) != -1 && order.indexOf(c) == -1)
			order += c;
	}

	return order;
}

function AFMatchMonth(d)
{
	var m = d.match(MuPDF.monthPattern);

	return m ? MuPDF.shortMonthName.indexOf(m[0]) : null;
}

function AFParseTime(str, d)
{
	if (!str)
		return d;

	var ampm = str.match(/(am|pm)/);
	var nums = str.match(/\d+/g);
	var hour, min, sec;

	if (!nums)
		return null;

	sec = 0;

	switch (nums.length)
	{
		case 3:
			sec = nums[2];
		case 2:
			hour = nums[0];
			min = nums[1];
			break;

		default:
			return null;
	}

	if (ampm == 'am' && hour < 12)
		hour = 12 + hour;

	if (ampm == 'pm' && hour >= 12)
		hour = 0 + hour - 12;

	d.setHours(hour, min, sec);

	if (d.getHours() != hour || d.getMinutes() != min || d.getSeconds() != sec)
		return null;

	return d;
}

function AFParseDateEx(d, fmt)
{
	var dt = AFExtractTime(d);
	var nums = dt[0].match(/\d+/g);
	var order = AFParseDateOrder(fmt);
	var text_month = AFMatchMonth(dt[0]);
	var dout = new Date();
	var year = dout.getFullYear();
	var month = dout.getMonth();
	var date = dout.getDate();

	dout.setHours(12,0,0);

	if (nums.length < 1 || nums.length > 3)
		return null;

	if (nums.length < 3 && text_month)
	{
		// Use the text month rather than one of the numbers
		month = text_month;
		order = order.replace('m','');
	}

	order = order.substr(0, nums.length);

	// If year and month specified but not date then use the 1st
	if (order == "ym" || (order == "y" && text_month))
		date = 1;

	for (var i = 0; i < nums.length; i++)
	{
		switch (order.charAt(i))
		{
			case 'y': year = nums[i]; break;
			case 'm': month = nums[i] - 1; break;
			case 'd': date = nums[i]; break;
		}
	}

	if (year < 100)
	{
		if (fmt.search("yyyy") != -1)
			return null;

		if (year >= 50)
			year = 1900 + year;
		else if (year >= 0)
			year = 2000 + year;
	}

	dout.setFullYear(year, month, date);

	if (dout.getFullYear() != year || dout.getMonth() != month || dout.getDate() != date)
		return null;

	return AFParseTime(dt[1], dout);
}

function AFDate_FormatEx(fmt)
{
	var d = AFParseDateEx(event.value, fmt);

	event.value = util.printd(fmt, d);
}

function AFNumber_Format(nDec,sepStyle,negStyle,currStyle,strCurrency,bCurrencyPrepend)
{
	var val = event.value;
	var fracpart;
	var intpart;
	var point = sepStyle&2 ? ',' : '.';
	var separator = sepStyle&2 ? '.' : ',';

	if (/^\D*\./.test(val))
		val = '0'+val;

	var groups = val.match(/\d+/g);

	switch (groups.length)
	{
	case 0:
		return;
	case 1:
		fracpart = '';
		intpart = groups[0];
		break;
	default:
		fracpart = groups.pop();
		intpart = groups.join('');
		break;
	}

	// Remove leading zeros
	intpart = intpart.replace(/^0*/,'');
	if (!intpart)
		intpart = '0';

	if ((sepStyle & 1) == 0)
	{
		// Add the thousands sepearators: pad to length multiple of 3 with zeros,
		// split into 3s, join with separator, and remove the leading zeros
		intpart = new Array(2-(intpart.length+2)%3+1).join('0') + intpart;
		intpart = intpart.match(/.../g).join(separator).replace(/^0*/,'');
	}

	if (!intpart)
		intpart = '0';

	// Adjust fractional part to correct number of decimal places
	fracpart += new Array(nDec+1).join('0');
	fracpart = fracpart.substr(0,nDec);

	if (fracpart)
		intpart += point+fracpart;

	if (bCurrencyPrepend)
		intpart = strCurrency+intpart;
	else
		intpart += strCurrency;

	if (/-/.test(val))
	{
		switch (negStyle)
		{
		case 0:
			intpart = '-'+intpart;
			break;
		case 1:
			break;
		case 2:
		case 3:
			intpart = '('+intpart+')';
			break;
		}
	}

	if (negStyle&1)
		event.target.textColor = /-/.text(val) ? color.red : color.black;

	event.value = intpart;
}

function AFSimple_Calculate(op, list)
{
	var res;

	switch (op)
	{
		case 'SUM':
			res = 0;
			break;
		case 'PRD':
			res = 1;
			break;
		case 'AVG':
			res = 0;
			break;
	}

	if (typeof list == 'string')
		list = list.split(/ *, */);

	for (var i = 0; i < list.length; i++)
	{
		var field = getField(list[i]);
		var value = Number(field.value);

		switch (op)
		{
			case 'SUM':
				res += value;
				break;
			case 'PRD':
				res *= value;
				break;
			case 'AVG':
				res += value;
				break;
			case 'MIN':
				if (i == 0 || value < res)
					res = value;
				break;
			case 'MAX':
				if (i == 0 || value > res)
					res = value;
				break;
		}
	}

	if (op == 'AVG')
		res /= list.length;

	event.value = res;
}
