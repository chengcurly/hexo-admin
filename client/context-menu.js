
var React = require('react')
var PT = React.PropTypes
var api = require('./api')
var cx = React.addons.classSet


function clickInsideElement( e, classNames ) {
  var el = e.srcElement || e.target;

  function existClassName () {
    if (el.classList) {
      for (let i in classNames) {
        if (el.classList.contains(classNames[i])) {
          return true
        }
      }  
    }
    return false;
  }

  if ( existClassName() ) {
    return el;
  } else {
    while ( el = el.parentNode ) {
      if ( existClassName() ) {
        return el;
      }
    }
  }

  return false;
}

function getPosition(e) {
  var posx = 0;
  var posy = 0;

  if (!e) var e = window.event;
  
  if (e.pageX || e.pageY) {
    posx = e.pageX;
    posy = e.pageY;
  } else if (e.clientX || e.clientY) {
    posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
    posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
  }

  return {
    x: posx,
    y: posy
  }
}

var ContextMenu = React.createClass({
  propTypes: {
    onNew: PT.func
  },

  getInitialState: function () {
    return {
      showing: false,
      taskItemInContext: null,
      isDirectory: true
    }
  },

  componentDidMount: function () {
    document.addEventListener('contextmenu', this._onContextMenu)
    document.addEventListener('click', this._onBlur)
    window.addEventListener('keyup', this._onKeyup)
    window.addEventListener('resize', this._onResize)
  },

  componentWillUnmount: function () {
    document.removeEventListener('contextmenu', this._onContextMenu)
    document.removeEventListener('click', this._onBlur)
    window.removeEventListener('keyup', this._onKeyup)
    window.removeEventListener('resize', this._onResize)
  },

  positionMenu: function (e) {
    var menu = this.refs.menu.getDOMNode()

    clickCoords = getPosition(e);
    clickCoordsX = clickCoords.x;
    clickCoordsY = clickCoords.y;

    menuWidth = menu.offsetWidth + 4;
    menuHeight = menu.offsetHeight + 4;

    windowWidth = window.innerWidth;
    windowHeight = window.innerHeight;

    if ( (windowWidth - clickCoordsX) < menuWidth ) {
      menu.style.left = windowWidth - menuWidth + "px";
    } else {
      menu.style.left = clickCoordsX + "px";
    }

    if ( (windowHeight - clickCoordsY) < menuHeight ) {
      menu.style.top = windowHeight - menuHeight + "px";
    } else {
      menu.style.top = clickCoordsY + "px";
    }
  },

  _onKeyup: function (e) {
    if (e.keyCode === 27) {
      this._onCancel()
    }
  },

  _onResize: function () {
    this._onCancel()
  },

  _onContextMenu: function (e) {
    e.preventDefault()
    e.stopPropagation()
    this.state.taskItemInContext = clickInsideElement(e, ['directory', 'posts_post'])

    if (this.state.taskItemInContext) {
      e.preventDefault()
      this.state.isDirectory = this.state.taskItemInContext.classList.contains('directory')
      this._onShow()
      this.positionMenu(e)
    } else {
      this.state.taskItemInContext = null
      this._onCancel()
    }
  },

  _onShow: function () {
    this.setState({showing: true})
  },

  _onBlur: function () {
    if (this.state.showing) {
      this._onCancel();
    }
  },

  _onNewPost: function (e) {
    e.preventDefault();
    this.props.onNew(this.state.taskItemInContext);
    this._onCancel();
  },

  _onNewCate: function () {
    e.preventDefault();
    this.props.onNew(this.state.taskItemInContext);
    this._onCancel();
  },

  _onDeleteCate: function () {

  },

  _onRename: function () {

  },

  _onDeletePost: function () {

  },

  _onCancel: function () {
    this.setState({showing: false})
  },

  _onChange: function (e) {
    this.setState({
      text: e.target.value
    })
  },

  render: function () {
    return <nav id="context-menu" className={cx({
      "context-menu": true,
      "context-menu__active": this.state.showing
    })} ref="menu">
      <ul className="context-menu__items">
        <li className="context-menu__item" onClick={this._onNewPost}>
          <a className="context-menu__link"><i className="fa fa-plus"></i>New Post</a>
        </li>
        <li className="context-menu__item" onClick={this._onNewCate}>
          <a className="context-menu__link"><i className="fa fa-plus-square"></i>New Category</a>
        </li>
        {this.state.isDirectory &&
        [<li className="context-menu__item" onClick={this._onDeleteCate}>
          <a className="context-menu__link"><i className="fa fa-trash-o"></i>Delete</a>
        </li>, <li className="context-menu__item" onClick={this._onRename}>
          <a className="context-menu__link"><i className="fa fa-edit"></i>Rename</a>
        </li>]
        }
      </ul>
    </nav>
  }
})

module.exports = ContextMenu
