
var Link = require('react-router').Link
var React = require('react/addons')
var cx = React.addons.classSet
var DataFetcher = require('./data-fetcher');
var api = require('./api');

var App = React.createClass({
  mixins: [DataFetcher((params) => {
    return {
      settings: api.settings()
    }
  })],
  render: function () {
    if (!this.state.settings) return <div className='app'></div>;
    return <div className={cx({
        "app": true,
        "theme-default": !this.state.settings.darkTheme,
        "theme-dark": this.state.settings.darkTheme
      })}>
      <div className="app_header">
        <div className="brand">
          <img src="logo.png" className="app_logo"/>
          <span className="app_title">UG Editor</span>
        </div>
        <ul className="app_nav">
          <li><Link to="posts">Posts</Link></li>
          <li><Link to="deploy">Deploy</Link></li>
          <li><Link to="settings">Settings</Link></li>
        </ul>
      </div>
      <div className="app_main">
        <this.props.activeRouteHandler/>
      </div>
    </div>;
  }
})

module.exports = App
