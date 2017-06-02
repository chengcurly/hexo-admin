const FORMATS = {
	h1: { type: 'block', token: 'header-1', before: '#', re: /^#\s+/, placeholder: '' },
	h2: { type: 'block', token: 'header-2', before: '##', re: /^##\s+/, placeholder: '' },
	h3: { type: 'block', token: 'header-3', before: '###', re: /^###\s+/, placeholder: '' },
	h4: { type: 'block', token: 'header-4', before: '####', re: /^####\s+/, placeholder: '' },
	h5: { type: 'block', token: 'header-5', before: '#####', re: /^#####\s+/, placeholder: '' },
	bold: { type: 'inline', token: 'strong', before: '**', after: '**', placeholder: '' },
	italic: { type: 'inline', token: 'em', before: '_', after: '_', placeholder: '' },
	link: { type: 'inline', token: 'link', before: '[', after: '](http://)', placeholder: '' },
	inlineImage: { type: 'inline', token: 'inline-image', before: '![', after: '](http://)', placeholder: '' },
	quote: { type: 'block', token: 'quote', re: /^\>\s+/, before: '>', placeholder: '' },
	oList: { type: 'block', before: '1.', re: /^\d+\.\s+/, placeholder: '' },
	uList: { type: 'block', before: '*', re: /^[\*\-]\s+/, placeholder: '' },
};

const FORMAT_TOKENS = {};
Object.keys(FORMATS).forEach(key => {
	if (FORMATS[key].token) FORMAT_TOKENS[FORMATS[key].token] = key;
});

function getCursorState (cm, pos) {
	pos = pos || cm.getCursor('start');
	var cs = {};
	var token = cs.token = cm.getTokenAt(pos);
	if (!token.type) return cs;
	var tokens = token.type.split(' ');
	tokens.forEach(t => {
		if (FORMAT_TOKENS[t]) {
			cs[FORMAT_TOKENS[t]] = true;
			return;
		}
		switch (t) {
			case 'link':
				cs.link = true;
				cs.link_label = true;
			break;
			case 'string':
				cs.link = true;
				cs.link_href = true;
			break;
			case 'variable-2':
				var text = cm.getLine(pos.line);
				if (/^\s*\d+\.\s/.test(text)) {
					cs.oList = true;
				} else {
					cs.uList = true;
				}
			break;
		}
	});
	return cs;
}

function applyFormat (cm, key) {
	if (key === 'fullScreen') {
		cm.setOption("fullScreen", !cm.getOption("fullScreen"));
		if(!/fullscreen/.test(document.body.className)) {
			document.body.className += " fullscreen";
		} else {
			document.body.className = document.body.className.replace(/\s*fullscreen\b/, "");
		}
		cm.focus()
	} else if (key === 'sideBySide') {
		var wrapper = cm.getWrapperElement();
		var editor = wrapper.parentNode.parentNode;

		if (!/editor_display-active/.test(editor.className)) {
			editor.className += " editor_display-active"
		} else {
			editor.className = editor.className.replace(/\s*editor_display-active\b/, "")
		}

		cm.setSize(editor.getBoundingClientRect().width, editor.getBoundingClientRect().height - editor.querySelector('.MDEditor_toolbar').getBoundingClientRect().height)
	} else {
		var cs = getCursorState(cm);
		var format = FORMATS[key];
		operations[format.type + (cs[key] ? 'Remove' : 'Apply')](cm, format);
	}
}

var operations = {
	inlineApply (cm, format) {
		var startPoint = cm.getCursor('start');
		var endPoint = cm.getCursor('end');

		cm.replaceSelection(format.before + cm.getSelection() + format.after);

		startPoint.ch += format.before.length;
		endPoint.ch += format.after.length;
		cm.focus();
		cm.setSelection(startPoint, endPoint);
	},
	inlineRemove (cm, format) {
		var startPoint = cm.getCursor('start');
		var endPoint = cm.getCursor('end');
		var line = cm.getLine(startPoint.line);

		var startPos = startPoint.ch;
		while (startPos) {
			if (line.substr(startPos, format.before.length) === format.before) {
				break;
			}
			startPos--;
		}

		var endPos = endPoint.ch;
		while (endPos <= line.length) {
			if (line.substr(endPos, format.after.length) === format.after) {
				break;
			}
			endPos++;
		}

		var start = line.slice(0, startPos);
		var mid = line.slice(startPos + format.before.length, endPos);
		var end = line.slice(endPos + format.after.length);
		cm.replaceRange(start + mid + end, { line: startPoint.line, ch: 0 }, { line: startPoint.line, ch: line.length + 1 });
		cm.focus();
		cm.setSelection({ line: startPoint.line, ch: start.length }, { line: startPoint.line, ch: (start + mid).length });
	},
	blockApply (cm, format) {
		var startPoint = cm.getCursor('start');
		var line = cm.getLine(startPoint.line);
		var text = format.before + ' ' + (line.length ? line.replace(/^#{1,5}\s+/, '') : format.placeholder);
		cm.replaceRange(text, { line: startPoint.line, ch: 0 }, { line: startPoint.line, ch: line.length + 1 });
		cm.focus();
		cm.setCursor({line: startPoint.line, ch: format.before.length + 1})
	},
	blockRemove (cm, format) {
		var startPoint = cm.getCursor('start');
		var line = cm.getLine(startPoint.line);
		var text = line.replace(format.re, '');
		cm.replaceRange(text, { line: startPoint.line, ch: 0 }, { line: startPoint.line, ch: line.length + 1 });
		cm.focus();
		cm.setSelection({ line: startPoint.line, ch: 0 }, { line: startPoint.line, ch: text.length });
	}
};

module.exports = {
	applyFormat: applyFormat	
}