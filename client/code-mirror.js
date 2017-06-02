
var React = require('react')
var CM = require('codemirror/lib/codemirror')
var PT = React.PropTypes
var api = require('./api')
var format = require('./format')
var classNames = require('classnames');


var Icon = {
  'bold': 'bold',
  'italic': 'italic',
  'oList': 'list-ol',
  'uList': 'list-ul',
  'quote': 'quote-left',
  'link': 'link',
  'inlineImage': 'picture-o',
  'upload': 'upload',
  'fullScreen': 'arrows-alt',
  'sideBySide': 'columns'
}

CM.defineOption("fullScreen", false, function(cm, val, old) {
  if (old == CM.Init) old = false;
  if (!old == !val) return;
  if (val) setFullscreen(cm);
  else setNormal(cm);
});

function setFullscreen(cm) {
  var wrap = cm.getWrapperElement();
  cm.state.fullScreenRestore = {scrollTop: window.pageYOffset, scrollLeft: window.pageXOffset,width: wrap.style.width, height: wrap.style.height};
  wrap.style.width = "";
  wrap.style.height = "auto";
  wrap.className += " CodeMirror-fullscreen";
  document.documentElement.style.overflow = "hidden";
  cm.refresh();
}

function setNormal(cm) {
  var wrap = cm.getWrapperElement();
  wrap.className = wrap.className.replace(/\s*CodeMirror-fullscreen\b/, "");
  document.documentElement.style.overflow = "";
  var info = cm.state.fullScreenRestore;
  wrap.style.width = info.width; wrap.style.height = info.height;
  window.scrollTo(info.scrollLeft, info.scrollTop);
  cm.refresh();
}

var CodeMirror = React.createClass({
  propTypes: {
    onScroll: PT.func,
    forceLineNumbers: PT.bool,
    adminSettings: PT.object
  },

  getInitialState () {
    return {
      cs: {}
    };
  },

  componentDidUpdate: function (prevProps) {
    if (prevProps.initialValue !== this.props.initialValue) {
      this.cm.setValue(this.props.initialValue)
    }
    // on forcing line numbers, set or unset linenumbers if not set in adminSettings
    if (prevProps.forceLineNumbers !== this.props.forceLineNumbers) {
      if (!(this.props.adminSettings.editor || {}).lineNumbers) {
        this.cm.setOption('lineNumbers', this.props.forceLineNumbers);
      }
    }
  },

  componentDidMount: function () {
    require('codemirror/mode/markdown/markdown')

    var editorSettings = {
      value: this.props.initialValue || '',
      theme: this.props.adminSettings.darkTheme ? 'material' : 'base16-light',
      mode: 'markdown',
      lineWrapping: true,
    }
    for (var key in this.props.adminSettings.editor) {
      editorSettings[key] = this.props.adminSettings.editor[key]
    }

    this.cm = CM(this.getDOMNode(), editorSettings);
    this.cm.on('change', (cm) => {
      this.props.onChange(cm.getValue())
    })
    this.cm.on('scroll', (cm) => {
      var node = cm.getScrollerElement()
      var max = node.scrollHeight - node.getBoundingClientRect().height
      this.props.onScroll(node.scrollTop / max)
    })
    var box = this.getDOMNode().parentNode.getBoundingClientRect()
    var headerBox = this.getDOMNode().querySelector('.MDEditor_toolbar').getBoundingClientRect()
    this.cm.setSize(box.width, box.height - headerBox.height)

    this.cm.focus()

    window.addEventListener('resize', this._onResize)

    document.addEventListener('paste', this._onPaste)
  },

  _onResize: function () {
    var box = this.getDOMNode().parentNode.getBoundingClientRect()
    // need to subtract header to get proper height without flexbox (see #124)
    this.cm.setSize(box.width, box.height - this.getDOMNode().parentNode.querySelector('.MDEditor_toolbar').getBoundingClientRect().height)
  },

  componentWillUnmount: function () {
    document.removeEventListener('paste', this._onPaste)
    window.removeEventListener('resize', this._onResize)
  },

  _onUpload: function (event) {
    var file = this.refs.fileUploader.getDOMNode().files[0]
    this.uploadImage(file)
  },

  _onPaste: function (event) {
    var items = (event.clipboardData || event.originalEvent.clipboardData).items;
    if (!items.length) return
    var blob;
    for (var i = items.length - 1; i >= 0; i--) {
      if (items[i].kind == 'file'){
        event.preventDefault();
        blob = items[i].getAsFile();
        break;
      }
    };
    if (!blob) return

    this.uploadImage(blob)
  },

  uploadImage (file) {
    var settings = this.props.adminSettings
    var reader = new FileReader();
    reader.onload = (event) => {
      var filename = null;
      if (settings.options) {
        if(!!settings.options.askImageFilename) {
          var filePath = !!settings.options.imagePath ? settings.options.imagePath : '/images'
          filename = prompt(`What would you like to name the photo? All files saved as pngs. Name will be relative to ${filePath}.`, 'image.png')
        }
      }
      api.uploadImage(event.target.result, filename).then((res) => {
        var cm = this.cm;
        setTimeout(function () {
          var startPoint = cm.getCursor('start');
          var line = cm.getLine(startPoint.line);
          cm.replaceRange(`![${line.length ? line : file.name}](${res.src})`, { line: startPoint.line, ch: 0 }, { line: startPoint.line, ch: line.length + 1 });
        }, 1000)
      });
    };
    reader.readAsDataURL(file);
  },

  renderToolbar () {
    return (
      <div className="MDEditor_toolbar">
        {this.renderButton('h1', 'H1')}
        {this.renderButton('h2', 'H2')}
        {this.renderButton('h3', 'H3')}
        {this.renderButton('h4', 'H4')}
        {this.renderButton('h5', 'H5')}
        {this.renderButton('bold', 'b')}
        {this.renderButton('italic', 'i')}
        {this.renderButton('oList', 'ol')}
        {this.renderButton('uList', 'ul')}
        {this.renderButton('quote', 'q')}
        {this.renderButton('link', 'a')}
        {this.renderButton('inlineImage', 'image')}
        {this.renderButton('upload', 'upload')}
        {this.renderButton('fullScreen', 'full-screen')}
        {this.renderButton('sideBySide', 'side-by-side')}
      </div>
    );
  },

  renderFileUploader () {
    return <input type="file" className="editor-file-uploader" ref="fileUploader" onChange={this._onUpload}/>
  },

  renderButton (formatKey, label, action) {
    if (!action) action = this.toggleFormat.bind(this, formatKey);

    var isTextIcon = (formatKey === 'h1' || formatKey === 'h2' || formatKey === 'h3' || formatKey === 'h4' || formatKey === 'h5');
    var className = classNames('MDEditor_toolbarButton', {
      'MDEditor_toolbarButton--pressed': this.state.cs[formatKey]
    }, ('MDEditor_toolbarButton--' + formatKey));

    var labelClass = isTextIcon ? 'MDEditor_toolbarButton_label-icon' : 'MDEditor_toolbarButton_label';

    return (
      <button className={className} onClick={action} title={formatKey}>
        {isTextIcon ? null : this.renderIcon(Icon[formatKey])}
        <span className={labelClass}>{label}</span>
      </button>
    );
  },

  renderIcon (icon) {
    return <span dangerouslySetInnerHTML={{__html: '<i class="fa fa-' + icon + '"></i>'}} className="MDEditor_toolbarButton_icon" />;
  },

  toggleFormat (formatKey, e) {
    e.preventDefault();
    if (formatKey === 'upload') {
      this.refs.fileUploader.getDOMNode().click()
    } else {
      format.applyFormat(this.cm, formatKey);      
    }
  },

  render: function () {
    return <div>{this.renderToolbar()}{this.renderFileUploader()}</div>
  }
})

module.exports = CodeMirror
