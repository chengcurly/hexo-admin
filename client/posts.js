
var path = require('path')
var React = require('react/addons')
var cx = React.addons.classSet
var Link = require('react-router').Link;
var Router = require('react-router');
var _ = require('lodash')
var moment = require('moment')
var SinceWhen = require('./since-when')

var Rendered = require('./rendered')
var DataFetcher = require('./data-fetcher');
var NewPost = require('./new-post')
var api = require('./api');

var Posts = React.createClass({
  mixins: [DataFetcher((params) => {
    return {
      tree: api.tree(),
      posts: api.posts().then((posts) =>
        _.sortBy(_.filter(posts, function(post) { return !post.isDiscarded }), ['isDraft', 'date']).reverse()
      )
    }
  })],

  getInitialState: function () {
    return {
      selected: 0
    }
  },

  _onNew: function (post) {
    var tree = this.state.tree
    console.log(tree)
  },

  goTo: function (id, e) {
    if (e) {
      e.preventDefault()
    }
    Router.transitionTo('post', {postId: id})
  },

  VisitTreePosts: function (props) {
    return (
      <ul className='posts_list'>
        {
          props.branch.articles.map((post, i) => 
            <li key={post._id} className={cx({
                "posts_post": true,
                "posts_post--draft": post.isDraft
              })}
              onDoubleClick={this.goTo.bind(null, post._id)}
              onClick={this.setState.bind(this, {selected: i}, null)}
            >
              <span className="posts_post-title">
                {post.title}
              </span>
              <Link className='posts_edit-link' to="post" postId={post._id}>
                <i className='fa fa-pencil'/>
              </Link>
            </li>
          )
        }
      </ul>
    )
  },

  render: function () {
    if (!this.state.posts) {
      return <div className='posts'>Loading...</div>
    }
    var current = this.state.posts[this.state.selected] || {}
    var url = window.location.href.replace(/^.*\/\/[^\/]+/, '').split('/')
    var rootPath = url.slice(0, url.indexOf('admin')).join('/')
    return <div className="posts">
      <NewPost onNew={this._onNew}/>

      <this.VisitTreePosts branch={this.state.tree}/>

      <div className={cx({
        'posts_display': true,
        'posts_display--draft': current.isDraft
      })}>
        {current.isDraft && <div className="posts_draft-message">Draft</div>}
        <Rendered
          ref="rendered"
          className="posts_content"
          text={current.content}/>
      </div>
    </div>
  }
});

module.exports = Posts;