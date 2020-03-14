var colorPalette;
var allAreas = {}; //by id
var areaSubTypes = {}; //by subTypes, eg., stats,farms

function rAreas() {

	setBodyColor();
	setTableSize(...SPEC.tableSize);

	colorPalette = getTransPalette9();

	console.log(SPEC)

	//return;
	for (const k in SPEC.views) { createLayout(k, SPEC.views[k].layout); }
}
function createLayout(parentName, l) {
	console.log('*** createLayout ***', parentName, l);

	let d = mBy(parentName);
	let areaNames = createGridLayout(d, l);

	console.log(areaNames, d)

	createAreas(d, areaNames, parentName);
}
function createGridLayout(d, layout) {

	//first need to make each line of grid layout equal sized! do I? what happens if I dont?

	let s = '';
	let m = [];
	let maxNum = 0;
	let areaNames = [];
	console.log('layout', layout)
	for (const line of layout) {
		let letters = line.split(' ');
		let arr = [];
		for (const l of letters) {
			if (!isEmpty(l)) {
				addIf(areaNames, l);
				arr.push(l);
			}
		}
		m.push(arr);
		if (arr.length > maxNum) maxNum = arr.length;
	}
	//console.log('jagged matrix:', m)

	//habe jagged array, muss into matrix verwandeln!
	//last letter of each row will be repeated!
	for (const line of m) {
		let el = line[line.length - 1];
		while (line.length < maxNum) line.push(el);
		s += '"' + line.join(' ') + '" ';

	}
	console.log('matrix:', m)

	//console.log(m);
	d.style.gridTemplateAreas = s;// eg. '"z z z" "a b c" "d e f"';

	if (SPEC.collapseEmptySmallLetterAreas) { collapseSmallLetterAreas(m, d); }
	else fixedSizeGrid(m, d);

	return areaNames;
}
function createAreas(d, areaNames, prefix) {
	let ipal = 1;
	for (const areaName of areaNames) {
		//create this area
		let d1 = document.createElement('div');
		let id = prefix + '.' + areaName;
		d1.id = id;

		d1.style.gridArea = areaName;
		if (SPEC.shadeAreaBackgrounds) { d1.style.backgroundColor = colorPalette[ipal]; ipal = (ipal + 1) % colorPalette.length; }
		if (SPEC.showAreaNames) { d1.innerHTML = makeAreaNameDomel(areaName); }
		UIS[id] = { elem: d1, children: [] };
		d.appendChild(d1);

		//if this area is listed in areaTypes, need to create additional layout!
		if (SPEC.areaTypes[areaName]) {
			//areaName zB opps
			let atype = SPEC.areaTypes[areaName];
			console.log(atype);
			if (atype.foreach) {
				console.log(atype.foreach); // its a string gsm.players.opponent
				let pool = serverData[atype.foreach.pool];
				if (pool) {
					let selProp = atype.foreach.selectionProperty;
					let selVal = atype.foreach.selectionValue;
					let nameProp = atype.foreach.nameProperty;
					for (const oid in pool) {
						let o = pool[oid];
						if (o[selProp] == selVal) {
							//create sub area 
							let name = o[nameProp];

						}
					}
				}
				return;
			}
			createLayout(id, atype.layout)
		} else {
			//need to enter leaf area id into areaSubTypes[areaName]!!!
			//=>suche function dafuer! 
		}

	}

}

//working previous version: works with uspec1.yaml
function rAreas_0() {
	let color = SPEC.color.theme;
	document.body.style.backgroundColor = color;
	let fg = colorIdealText(color)
	document.body.style.color = fg;

	let palette = getTransPalette9(); //getPalette(color);//palette.length-1;
	let ipal = 1;
	let d = document.getElementById('areaTable');
	setTableSize(...SPEC.tableSize);
	// d.style.display = 'inline-grid';
	// d.style.justifyContent = 'center'
	let s = '';
	let m = [];
	for (const line of SPEC.layout) {
		s += '"' + line + '" ';
		let letters = line.split(' ');
		let arr = [];
		for (const l of letters) { if (!isEmpty(l)) arr.push(l); }
		m.push(arr);
	}
	//console.log(m);
	d.style.gridTemplateAreas = s;// eg. '"z z z" "a b c" "d e f"';

	if (SPEC.collapseEmptySmallLetterAreas) { collapseSmallLetterAreas(m, d); }
	else fixedSizeGrid(m, d);

	for (const k in SPEC.areas) {
		let areaName = SPEC.areas[k];
		let d1 = document.createElement('div');
		d1.id = areaName;
		d1.style.gridArea = k;
		if (SPEC.shadeAreaBackgrounds) { d1.style.backgroundColor = palette[ipal]; ipal = (ipal + 1) % palette.length; }
		if (SPEC.showAreaNames) { d1.innerHTML = makeAreaNameDomel(areaName); }
		UIS[areaName] = { elem: d1, children: [] };
		d.appendChild(d1);
	}
}
function rPlayerStatsAreas() {

	if (nundef(serverData.players)) return;

	if (nundef(SPEC.playerStatsAreas)) return;
	let loc = SPEC.playerStatsAreas.loc;
	//loc has to be existing area in layout!
	let dOthers = mById(loc);
	if (nundef(dOthers)) return;
	//console.log('object to be mapped is',omap);
	let func = SPEC.playerStatsAreas.type;

	let objects = [];
	for (const plid in serverData.players) {
		let o = serverData.players[plid];
		if (plid != GAMEPLID) {
			o.id = plid;
			objects.push(o)
		}
	}
	let areaNames = objects.map(x => x.name);
	//console.log('objects',objects,'\nareaNames',areaNames);
	//console.log('func',window[func].name,'\nloc',loc);
	let structObject = window[func](areaNames, loc);
}

//#region helpers
function setTableSize(w, h, unit = 'px') {
	//console.log(w,h);
	let d = mBy('areaTable');
	mStyle(d, { 'min-width': w, 'min-height': h }, unit);
	// setCSSVariable('--hTable', h + unit);
	// setCSSVariable('--wTable', w + unit);
	//mById('tableTop').style.setProperty('width', w + unit);
}
function makeAreaNameDomel(areaName) { return `<div style='width:100%'>${areaName}</div>`; }
function fixedSizeGrid(m, d) {
	let rows = m.length;
	let cols = m[0].length;
	d.style.gridTemplateColumns = 'repeat(' + cols + ',1fr)'; // gtc.join(' '); //'min-content 1fr 1fr min-content';// 'min-content'.repeat(rows);
	d.style.gridTemplateRows = 'repeat(' + rows + ',1fr)'; // //'min-content 1fr 1fr min-content';// 'min-content'.repeat(rows);
}
function collapseSmallLetterAreas(m, d) {
	//how many columns does this grid have?
	let rows = m.length;
	let cols = m[0].length;
	//console.log(m);

	let gtc = [];
	for (let c = 0; c < cols; c++) {
		gtc[c] = 'min-content';
		for (let r = 0; r < rows; r++) {
			let sArea = m[r][c];
			//console.log(c, r, m[r], m[r][c]);
			if (sArea[0] == sArea[0].toUpperCase()) gtc[c] = 'auto';
		}
	}
	let cres = gtc.join(' ');
	//console.log('cols', cres);
	d.style.gridTemplateColumns = gtc.join(' '); //'min-content 1fr 1fr min-content';// 'min-content'.repeat(rows);

	let gtr = [];
	for (let r = 0; r < rows; r++) {
		gtr[r] = 'min-content';
		for (let c = 0; c < cols; c++) {
			let sArea = m[r][c];
			//console.log(r, c, m[r], m[r][c]);
			if (sArea[0] == sArea[0].toUpperCase()) gtr[r] = 'auto';
		}
	}
	let rres = gtr.join(' ');
	//console.log('rows', rres);
	d.style.gridTemplateRows = gtr.join(' '); //'min-content 1fr 1fr min-content';// 'min-content'.repeat(rows);

	// d.style.gridTemplateRows = '1fr 1fr min-content min-content';// 'min-content'.repeat(cols);

}









