
var React = require('react')
var PT = React.PropTypes
var api = require('./api')

var NewPost = React.createClass({
  propTypes: {
    onNew: PT.func,
    postData: PT.object
  },

  getInitialState: function () {
    return {
      editing: false,
      text: 'Untitled'
    }
  },

  componentDidUpdate: function (prevProps, prevState) {
    if (this.state.showing && !prevState.showing) {
      var node = this.refs.input.getDOMNode()
      node.focus()
      node.selectionStart = 0
      node.selectionEnd = node.value.length
    }
  },

  _onKeydown: function (e) {
    if (e.key === 'Enter') {
      this._onSubmit(e)
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

  _onSubmit: function (e) {
    e.preventDefault();
    this.setState({loading: true, showing: false})
    let props = {title: this.state.text}

    if (this.props.postData) {
      props = $.extend(props, this.props.postData)
    }
    api.newPost(props).then((post) => {
      this.setState({editing: false, text: 'Untitled'})
      this.props.onNew(post)
    }, (err) => {
      console.error('Failed! to make post', err)
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
