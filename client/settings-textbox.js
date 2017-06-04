
var React = require('react/addons')
var PT = React.PropTypes
var api = require('./api')

var SettingsTextbox = React.createClass({
  propTypes: {
    name: PT.string.isRequired,
    defaultValue: PT.string.isRequired,
    label: PT.string.isRequired,
    mode: PT.string,
  },

  getInitialState: function () {
    return {
      value: this.props.defaultValue
    }
  },

  componentDidMount: function() {
    var name = this.props.name
    var defaultValue = this.props.defaultValue
    var requestTarget = api.settings

    if (this.props.mode === 'Deploy') {
      requestTarget = api.deploys
    }

    requestTarget().then( (settings) => {
      var value;
      if (!settings.options) {
        value = defaultValue
      } else {
        if(!settings.options[name]) {
          value = defaultValue
        } else {
          value = settings.options[name]
        }
      }
      this.setState({value: value})
    })
  },

  handleChange: function(e) {
    var name = this.props.name
    var value = e.target.value
    var requestTarget = api.setSetting

    if (this.props.mode === 'Deploy') {
      requestTarget = api.setDeploy
    }
    requestTarget(name, value).then( (result) => {
      this.setState({
        value: result.settings.options[name]
      });
    });
  },

  render: function() {
    return (
      <p>
        <b>{this.props.label}:  </b>
        <input
          type="text"
          onChange={this.handleChange}
          value ={this.state.value}
        />
      </p>
    );
  }
});

module.exports = SettingsTextbox
