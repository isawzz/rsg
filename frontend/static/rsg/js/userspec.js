function specAndDOM(callbacks = []) {
	flags.specAndDOM = false;
	initSETTINGS();
	initPageHeader();
	initTABLES();
	initDom();

	//if user spec and/or code is present, load them into corresponding tabs!!!
	presentSpecAndCode();

	let hasStructure = false;
	if (S.settings.userStructures) hasStructure = initSTRUCTURES();
	//console.log(hasStructure,S.settings)
	if (!hasStructure && S.settings.boardDetection) {
		detectBoard(G.table, 'a_d_game');
		timit.showTime('*** board end ***')

	}
	if (!hasStructure && S.settings.deckDetection) {
		detectDecks(G.table, 'a_d_game');
	}
	openTabTesting(S.settings.openTab);

	if (!isEmpty(callbacks)) callbacks[0](arrFromIndex(callbacks, 1));
}
function initSTRUCTURES() {
	let data = S.user.spec.STRUCTURES;
	if (nundef(data)) return;

	BINDINGS = {};
	let hasStructure = false;
	for (const areaName in data) {
		reqs = data[areaName];
		let mobj = makeArea(areaName, reqs.location);
		let areaId = mobj.id;

		for (const prop in reqs) {
			let val = reqs[prop];
			if (prop == 'location') continue;
			if (prop == 'structure') {
				hasStructure = true; // this is to prevent default board detection!!!!
				let info = reqs.structure;

				let func = info.type; // rsg will build a structure of desired type if known! eg., hexGrid, quadGrid,...

				let odict = parseDictionaryName(info.object_pool);
				if (!odict) odict = G.table; //default object pool to get board and board member objects from
				let boardInfo = info.cond; //object in object_pool representing board, its id will be board main id!

				let structObject = window[func](odict, areaId, boardInfo);
				timit.showTime('*** board end ***')

				// unused im moment
			} else if (prop == 'binding') {
				BINDINGS[areaId] = val;

			} else {
				// rsg tries to set this prop for areaName object! eg., visual props bg, fg, bounds
				let lst = jsCopy(val);

				let func = 'set' + capitalize(prop);
				let params = lst;
				//console.log('*** calling',func+'('+params+')');
				if (!Array.isArray(params)) params = params.split(',');
				if (mobj[func] !== null) mobj[func](...params);
			}
		}
	}
	return hasStructure;
}
function presentSpecAndCode(callbacks = []) {
	let d = document.getElementById('a_d_spec_content');
	if (S.user.spec && S.settings.userSettings) {
		d.innerHTML = S.user.specText;
	} else { d.innerHTML = ''; }

	d = document.getElementById('a_d_code_content');
	if (S.user.script && S.settings.userBehaviors) {
		d.innerHTML = S.user.script;
	} else { d.innerHTML = ''; }

	$('pre').html(function () {
		return this.innerHTML.replace(/\t/g, '&nbsp;&nbsp;');
	});

	if (!isEmpty(callbacks)) callbacks[0](arrFromIndex(callbacks, 1));
}

function redrawScreen() {
	checkCleanup_II();

	//console.log('use behaviors', S.settings.userBehaviors, FUNCS);
	if (S.settings.userBehaviors) {
		//load code again!
		// loadCode_dep(userCode.asText,setUserSpecAndCode);
		loadCode0(userCode.asText, 'setUserSpecAndCode();proceedRedraw();', () => {
			console.log('setting code now!')
			setUserSpecAndCode();
			proceedRedraw();
			// console.log(onCodeLoaded)
			// if (onCodeLoaded) onCodeLoaded();
		});
		console.log('userCode', userCode);
	}
	else proceedRedraw();
	// 	//console.log('geht in user behaviors in redrawScreen')
	// 	restoreBehaviors
	// 	loadScript(S.path.script, proceedRedraw);
	// } else proceedRedraw();
}
function proceedRedraw() {
	flags.specAndDOM = true;
	let xdata = G.serverData;
	G = { table: {}, players: {}, signals: {} }; //server objects
	UIS = {}; // holds MSOB objects 
	IdOwner = {}; //lists of ids by owner
	id2oids = {}; // { uid : list of server object ids (called oids) }
	oid2ids = {}; // { oid : list of mobj ids (called ids or uids) }
	id2uids = {}; // { uid : list of mobj ids related to same oid }

	//console.log(jsCopy(S), jsCopy(G));
	//console.log('proceedRedraw nach daten loeschen')

	initDom();
	gameStep(xdata);
	// console.log('nach initDom')
	// processData(xdata)
	// console.log('nach processData')
	// specAndDOM([gameStep]);
	// console.log('specAndDOM')
}

function onClickPlain() {
	S.settings.userBehaviors = false;
	S.settings.userStructures = false;
	S.settings.userSettings = false;
	S.settings.boardDetection = S_boardDetection = false;
	S.settings.deckDetection = S_deckDetection = false;
	S.settings.openTab = 'ObjectsTab';
	redrawScreen();
}
function onClickDetection() {
	S.settings.userBehaviors = false;
	S.settings.userStructures = false;
	S.settings.userSettings = false;
	S.settings.boardDetection = S_boardDetection = true;
	S.settings.deckDetection = S_deckDetection = true;
	S.settings.openTab = 'ObjectsTab';
	redrawScreen();
}
function onClickUseSettings() {
	S.settings.userBehaviors = false;
	S.settings.userStructures = false;
	S.settings.userSettings = true;
	S.settings.boardDetection = S_boardDetection = true;
	S.settings.deckDetection = S_deckDetection = true;
	S.settings.openTab = 'SettingsTab';
	redrawScreen();
}
function onClickSpec() {
	//flags.specAndDOM = true;
	S.settings.userBehaviors = false;
	S.settings.userStructures = true;
	S.settings.userSettings = true;
	S.settings.boardDetection = S_boardDetection = true;
	S.settings.deckDetection = S_deckDetection = true;
	S.settings.openTab = 'SpecTab';
	redrawScreen();
}
function onClickSpecAndCode() {
	S.settings.userBehaviors = true;
	S.settings.userStructures = true;
	S.settings.userSettings = true;
	S.settings.boardDetection = S_boardDetection = true;
	S.settings.deckDetection = S_deckDetection = true;
	S.settings.openTab = 'CodeTab';
	redrawScreen();
}
async function onClickReloadSpec() {
	await loadSpecAndCode();
	presentSpecAndCode();
	redrawScreen();
}

function loadUserSpec(callbacks = []) {
	sendRoute('/get_UI_spec/' + GAME, d1 => {
		try {
			S.user.spec = JSON.parse(d1);
			//console.log(S.user.spec);
			sendRoute('/spec/' + GAME, d2 => {
				//console.log(d2);
				S.user.specText = d2;
				if (!isEmpty(callbacks)) callbacks[0](arrFromIndex(callbacks, 1));
			});
		} catch {
			S.user.spec = null;
			S.user.specText = 'null';
			if (!isEmpty(callbacks)) callbacks[0](arrFromIndex(callbacks, 1));
		}
	});
}

//not used anymore!!!
function loadUserCode(callbacks = []) {
	//timit.showTime(getFunctionCallerName());
	let fname = S.user.spec ? S.user.spec.CODE : null;
	//console.log('...loading code from', fname + '.js')
	if (nundef(fname)) {
		S.user.script = 'no code';
		if (!isEmpty(callbacks)) callbacks[0](arrFromIndex(callbacks, 1));
	} else {
		//console.log('code filename is:', fname)
		//S.path.script = '/examples_front/' + S.settings.game + '/' + fname + '.js';
		S.path.script = '/games/' + S.settings.game + '/_rsg/' + fname + '.js';
		//S.path.script = '/games/' + allGames[S.settings.game].name + '/' + fname + '.js';
		loadScript(S.path.script, dScript => {
			loadText(S.path.script, code => {
				console.log('script.onload DOES WORK!!!!!!!!!!!!')
				S.user.script = code;
				if (!isEmpty(callbacks)) callbacks[0](arrFromIndex(callbacks, 1));
			});
		});
	}
}


