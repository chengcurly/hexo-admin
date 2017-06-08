
var React = require('react')
var PT = React.PropTypes
var api = require('./api')

var NewPost = React.createClass({
  propTypes: {
    onRename: PT.func,
    cateId: PT.string,
    cateName: PT.string,
    editingCate: PT.string
  },

  getInitialState: function () {
    return {
      editing: false,
      text: this.props.cateName
    }
  },

  componentDidUpdate: function (prevProps, prevState) {
    if (this.state.editing && !prevState.editing) {
      var node = this.refs.input.getDOMNode()
      node.focus()
      node.selectionStart = 0
      node.selectionEnd = node.value.length
    }
  },

  componentWillReceiveProps(nextProps) {
    if (nextProps.editingCate !== this.props.editingCate) {
      this.setState({ editing: nextProps.editingCate === this.props.cateId })
    }
  },

  _onKeydown: function (e) {
    if (e.key === 'Enter') {
      this._onSubmit(e)
    }
  },

  _onShow: function () {
    this.setState({editing: true})
  },

  _onBlur: function () {
    if (this.state.editing) {
      this._onCancel();
    }
  },

  _onSubmit: function (e) {
    e.preventDefault();
    this.setState({editing: false})
    let props = {
      id: this.props.cateId,
      name: this.state.text
    }

    api.renameCate(props).then(() => {
      this.setState({editing: false, text: props.name})
      this.props.onRename(props)
    }, (err) => {
      console.error('Failed! to rename cate', err)
    })
  },

  _onCancel: function () {
    this.setState({editing: false})
  },

  _onChange: function (e) {
    this.setState({
      text: e.target.value
    })
  },

  render: function () {
    if (this.state.editing) {
      return <input className="cate_editor_input"
        ref="input"
        value={this.state.text}
        onBlur={this._onBlur}
        onKeyPress={this._onKeydown}
        onChange={this._onChange}
        />
    }
    return <span>{this.state.text}</span>
  }
})

module.exports = NewPost
